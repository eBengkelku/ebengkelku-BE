# Encryption Keys Directory

This directory contains RSA key pairs for encrypting user PII data.

## Purpose

- **Primary**: Encrypt personal identifiable information (PII) in the `core.users` table
- **Compliance**: Indonesia Personal Data Protection (UU PDP) compliance
- **Security**: Hybrid encryption using RSA-OAEP + AES-256-GCM

## Files

| File | Description | Security Level |
|------|-------------|----------------|
| `private-key.json` | RSA private key (encrypted with passphrase) | HIGHLY SENSITIVE |
| `public-key.json` | RSA public key | Can be shared |
| `README.md` | This documentation | Public |

## Key Generation

To generate new encryption keys, run:

```bash
# Interactive mode (recommended)
pnpm run generate:encryption-keys

# With passphrase argument
pnpm run generate:encryption-keys --passphrase "your-secure-passphrase"
```

### Passphrase Requirements

- Minimum 16 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## Environment Variables

Set the following environment variables in your `.env` file:

```env
# Path to private key file (optional, defaults to config path)
ENCRYPTION_PRIVATE_KEY_PATH=./src/config/encryption-keys/private-key.json

# Path to public key file (optional, defaults to config path)
ENCRYPTION_PUBLIC_KEY_PATH=./src/config/encryption-keys/public-key.json

# Passphrase for decrypting the private key
ENCRYPTION_KEY_PASSPHRASE=your-secure-passphrase
```

## Security Notes

1. **NEVER** commit `private-key.json` to version control
2. Store the passphrase in a secure secrets manager (not in .env for production)
3. Rotate keys every 90 days
4. Keep backup of keys in secure location
5. Access to private key should be restricted to authorized personnel only

## Usage in Code

```typescript
import { EncryptionService } from './jobs/user-encryption/services/encryption.service';

// Initialize with key paths
const encryptionService = new EncryptionService(
  './config/encryption-keys/private-key.json',
  './config/encryption-keys/public-key.json',
  process.env.ENCRYPTION_KEY_PASSPHRASE,
);

// Encrypt data
const encrypted = encryptionService.encrypt('sensitive data');

// Decrypt data
const decrypted = encryptionService.decrypt(encrypted);
```

## Key Rotation

When rotating keys:

1. Generate new key pair
2. Re-encrypt all existing data with new keys
3. Update environment variables
4. Securely delete old keys after verification

## File Location

The encryption service looks for keys at:
- Private key: `./src/config/encryption-keys/private-key.json`
- Public key: `./src/config/encryption-keys/public-key.json`

Relative to the `root_src` directory.

## Troubleshooting

### Error: Unable to decrypt private key

- Verify the passphrase is correct
- Ensure the private key file is not corrupted
- Check file permissions

### Error: Key file not found

- Run `pnpm run generate:encryption-keys` to generate keys
- Verify file paths in environment variables

## Related Documentation

- [Technical Plan](../docs/jobs-user-encryption-cron-technical-plan.md)
- [Configuration Guide](../docs/configuration-environment-setup-guide.md)

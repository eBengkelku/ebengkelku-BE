# User PII Encryption Documentation

## Overview

Complete technical documentation for the User PII Encryption system. This document covers architecture, components, configuration, and implementation details for encrypting user personally identifiable information (PII) in compliance with Indonesia's UU PDP.

---

## TL;DR

- **Encryption**: Hybrid RSA-4096 + AES-256-GCM
- **Storage Format**: `encryptedKey.iv.tag.ciphertext` (Base64 dot-delimited)
- **Protected Fields**: name, email, phone, provider, provider_id
- **Batch Processing**: Configurable batch size with retry logic
- **Cron Schedule**: Configurable (default: `0 2 * * *` - daily at 2 AM)

---

## Architecture Overview

```
+-------------------+     +-------------------+     +-------------------+
|  UserEncryption   |     |   Encryption      |     |   Database        |
|  JobService       | --> |   Service         | --> |   Service         |
+-------------------+     +-------------------+     +-------------------+
        |                         |                         |
        v                         v                         v
  - Cron scheduling         - Key management          - Knex queries
  - Batch processing        - RSA/AES encryption      - Transactions
  - Retry logic             - Serialization           - core.users table
```

### Module Structure

```
src/jobs/user-encryption/
├── constants/
│   └── encryption.constants.ts    # Configuration constants
├── interfaces/
│   └── encryption.interfaces.ts   # TypeScript interfaces
├── services/
│   ├── encryption.service.ts      # Core encryption logic
│   └── user-encryption-job.service.ts  # Batch job service
├── __tests__/
│   ├── encryption.service.spec.ts
│   └── user-encryption-job.service.spec.ts
└── user-encryption.module.ts      # NestJS module
```

---

## Core Concepts

### 1. Hybrid Encryption

Combines asymmetric (RSA) and symmetric (AES) encryption:

| Algorithm   | Purpose         | Key Size  |
| ----------- | --------------- | --------- |
| RSA-OAEP    | Encrypt AES key | 4096 bits |
| AES-256-GCM | Encrypt data    | 256 bits  |

**Why Hybrid?**

- RSA is secure but slow for large data
- AES is fast but requires secure key exchange
- Hybrid gets benefits of both

### 2. Serialization Format

Encrypted data stored as single string:

```
{encryptedKey}.{iv}.{tag}.{ciphertext}
```

| Component    | Description           | Size               |
| ------------ | --------------------- | ------------------ |
| encryptedKey | RSA-encrypted AES key | 512 bytes (Base64) |
| iv           | Initialization vector | 12 bytes (Base64)  |
| tag          | Authentication tag    | 16 bytes (Base64)  |
| ciphertext   | Encrypted data        | Variable (Base64)  |

### 3. Key Management

Keys stored as JSON files:

```
config/jwks/
├── public-key.json   # RSA public key (PEM format)
└── private-key.json  # RSA private key (encrypted PEM)
```

---

## Components

### EncryptionService

Core encryption/decryption service.

**Key Methods**:

| Method                          | Description                           |
| ------------------------------- | ------------------------------------- |
| `encrypt(plaintext)`            | Encrypt to IEncryptedData object      |
| `decrypt(data)`                 | Decrypt IEncryptedData to plaintext   |
| `encryptToString(plaintext)`    | Encrypt directly to serialized string |
| `decryptFromString(serialized)` | Decrypt from serialized string        |
| `serialize(data)`               | Convert IEncryptedData to string      |
| `deserialize(string)`           | Convert string to IEncryptedData      |
| `validateKeys()`                | Verify key pair is valid              |
| `isReady()`                     | Check if service is initialized       |

### UserEncryptionJobService

Batch processing cron job service.

**Key Methods**:

| Method                | Description                 |
| --------------------- | --------------------------- |
| `executeJob()`        | Run encryption job manually |
| `handleCron()`        | Cron-triggered execution    |
| `encryptBatch(users)` | Encrypt array of users      |
| `getPendingCount()`   | Count unencrypted users     |
| `triggerJob()`        | Programmatic job trigger    |

---

## Configuration

### Environment Variables

| Variable                      | Description              | Default     |
| ----------------------------- | ------------------------ | ----------- |
| `ENCRYPTION_PUBLIC_KEY_PATH`  | Path to public key JSON  | Required    |
| `ENCRYPTION_PRIVATE_KEY_PATH` | Path to private key JSON | Required    |
| `ENCRYPTION_KEY_PASSPHRASE`   | Private key passphrase   | Required    |
| `ENCRYPTION_CRON_SCHEDULE`    | Cron expression          | `0 2 * * *` |
| `ENCRYPTION_BATCH_SIZE`       | Users per batch          | `100`       |
| `ENCRYPTION_BATCH_DELAY_MS`   | Delay between batches    | `1000`      |
| `ENCRYPTION_MAX_RETRIES`      | Retry attempts per user  | `3`         |
| `ENCRYPTION_DRY_RUN`          | Test mode (no DB writes) | `false`     |

### Constants

```typescript
// Batch configuration
BATCH_CONFIG = {
  DEFAULT_SIZE: 100,
  DEFAULT_DELAY_MS: 1000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 500,
};

// Encryption algorithms
ENCRYPTION_ALGORITHMS = {
  RSA: 'RSA-OAEP',
  AES: 'aes-256-gcm',
  HASH: 'sha256',
};

// Serialization
SERIALIZATION = {
  DELIMITER: '.',
  PARTS_COUNT: 4,
  INDEX: {
    ENCRYPTED_KEY: 0,
    IV: 1,
    TAG: 2,
    CIPHERTEXT: 3,
  },
};
```

---

## Database Schema

### Users Table (core.users)

```sql
ALTER TABLE core.users
  ALTER COLUMN name TYPE TEXT,
  ALTER COLUMN email TYPE TEXT,
  ALTER COLUMN phone TYPE TEXT,
  ALTER COLUMN provider TYPE TEXT,
  ALTER COLUMN provider_id TYPE TEXT;

-- Encryption status tracking
ALTER TABLE core.users
  ADD COLUMN encryption_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN encrypted_at TIMESTAMP NULL;
```

### Encryption Status Values

| Status      | Description            |
| ----------- | ---------------------- |
| `pending`   | Not yet encrypted      |
| `encrypted` | Successfully encrypted |
| `failed`    | Encryption failed      |

---

## Usage Examples

### Manual Job Execution

```typescript
// Inject service
constructor(
  private readonly encryptionJob: UserEncryptionJobService,
) {}

// Execute job
const result = await this.encryptionJob.executeJob();
console.log(result);
// {
//   jobRunId: 'uuid',
//   status: 'completed',
//   totalUsersFound: 100,
//   totalEncrypted: 100,
//   totalFailed: 0,
// }
```

### Direct Encryption

```typescript
// Encrypt single value
const encrypted = this.encryptionService.encryptToString('user@example.com');
// "YWJj...==.MTIz...==.dGFn...==.Y2lw...=="

// Decrypt
const decrypted = this.encryptionService.decryptFromString(encrypted);
// "user@example.com"
```

---

## Best Practices

### DO

- Store keys in secure location (HSM, KMS, or encrypted storage)
- Use environment variables for key paths and passphrase
- Monitor job execution logs for failures
- Test with dry-run mode before production
- Backup keys securely (separate from database backups)

### DON'T

- Store private key in version control
- Use weak passphrases for private key
- Skip key validation on startup
- Ignore encryption failures
- Store encrypted and unencrypted data together long-term

---

## Error Handling

### Error Codes

| Code                         | Description                 | Resolution                          |
| ---------------------------- | --------------------------- | ----------------------------------- |
| `ENCRYPTION_NOT_INITIALIZED` | Keys not loaded             | Check key paths and passphrase      |
| `ENCRYPTION_FAILED`          | Encryption operation failed | Check input data validity           |
| `DECRYPTION_FAILED`          | Decryption operation failed | Verify data format and keys         |
| `KEY_VALIDATION_FAILED`      | Invalid key pair            | Regenerate or restore keys          |
| `BATCH_ERROR`                | Batch processing failed     | Check logs for specific user errors |

---

## Related Documentation

- [User PII Encryption Overview](security-user-pii-encryption-overview.md)
- [User PII Encryption Guide](security-user-pii-encryption-guide.md)
- [User PII Encryption Examples](security-user-pii-encryption-examples.md)

---

**Version**: 1.0.0
**Last Updated**: 2026-01-26

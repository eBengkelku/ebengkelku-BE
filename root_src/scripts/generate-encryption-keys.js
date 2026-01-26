/**
 * Encryption Key Generation Script
 *
 * This script generates RSA key pairs for encrypting user PII data.
 * Uses RSA-OAEP with 4096-bit key for maximum security.
 *
 * Usage:
 *   pnpm run generate:encryption-keys
 *   pnpm run generate:encryption-keys --passphrase "your-secure-passphrase"
 *
 * @module GenerateEncryptionKeys
 * @version 1.0.0
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const CONFIG = {
  keySize: 4096,
  outputDir: path.join(__dirname, '..', 'src', 'config', 'encryption-keys'),
  privateKeyFile: 'private-key.json',
  publicKeyFile: 'public-key.json',
  readmeFile: 'README.md',
  keyNames: {
    private: 'PRIVATE_KEY_MY_KEY',
    public: 'PUBLIC_KEY_MY_KEY',
  },
};

/**
 * Creates readline interface for user input
 * @returns {readline.Interface} Readline interface
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Prompts user for passphrase securely
 * @param {readline.Interface} rl - Readline interface
 * @param {string} prompt - Prompt message
 * @returns {Promise<string>} User input
 */
function promptPassword(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Validates passphrase strength
 * @param {string} passphrase - Passphrase to validate
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 */
function validatePassphrase(passphrase) {
  const errors = [];

  if (!passphrase || passphrase.length < 16) {
    errors.push('Passphrase must be at least 16 characters long');
  }

  if (!/[A-Z]/.test(passphrase)) {
    errors.push('Passphrase must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(passphrase)) {
    errors.push('Passphrase must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(passphrase)) {
    errors.push('Passphrase must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passphrase)) {
    errors.push('Passphrase must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generates RSA key pair
 * @param {string} passphrase - Passphrase for encrypting private key
 * @returns {{ publicKey: string, privateKey: string }} Generated key pair
 */
function generateKeyPair(passphrase) {
  console.log('Generating RSA key pair...');
  console.log(`Key size: ${CONFIG.keySize} bits`);

  const startTime = Date.now();

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: CONFIG.keySize,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase: passphrase,
    },
  });

  const duration = Date.now() - startTime;
  console.log(`Key pair generated in ${duration}ms`);

  return { publicKey, privateKey };
}

/**
 * Ensures output directory exists
 */
function ensureOutputDirectory() {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log(`Created directory: ${CONFIG.outputDir}`);
  }
}

/**
 * Saves keys to JSON files
 * @param {{ publicKey: string, privateKey: string }} keys - Key pair
 */
function saveKeysToFiles(keys) {
  // Save private key
  const privateKeyPath = path.join(CONFIG.outputDir, CONFIG.privateKeyFile);
  const privateKeyContent = {
    [CONFIG.keyNames.private]: keys.privateKey,
    generated_at: new Date().toISOString(),
    algorithm: 'RSA-OAEP',
    key_size: CONFIG.keySize,
    encryption: 'AES-256-CBC',
    warning: 'DO NOT COMMIT THIS FILE TO VERSION CONTROL',
  };
  fs.writeFileSync(privateKeyPath, JSON.stringify(privateKeyContent, null, 2));
  console.log(`Private key saved to: ${privateKeyPath}`);

  // Save public key
  const publicKeyPath = path.join(CONFIG.outputDir, CONFIG.publicKeyFile);
  const publicKeyContent = {
    [CONFIG.keyNames.public]: keys.publicKey,
    generated_at: new Date().toISOString(),
    algorithm: 'RSA-OAEP',
    key_size: CONFIG.keySize,
  };
  fs.writeFileSync(publicKeyPath, JSON.stringify(publicKeyContent, null, 2));
  console.log(`Public key saved to: ${publicKeyPath}`);
}

/**
 * Creates README.md with instructions
 */
function createReadme() {
  const readmePath = path.join(CONFIG.outputDir, CONFIG.readmeFile);
  const readmeContent = `# Encryption Keys Directory

This directory contains RSA key pairs for encrypting user PII data.

## Purpose

- **Primary**: Encrypt personal identifiable information (PII) in the \`core.users\` table
- **Compliance**: Indonesia Personal Data Protection (UU PDP) compliance
- **Security**: Hybrid encryption using RSA-OAEP + AES-256-GCM

## Files

| File | Description | Security Level |
|------|-------------|----------------|
| \`private-key.json\` | RSA private key (encrypted with passphrase) | HIGHLY SENSITIVE |
| \`public-key.json\` | RSA public key | Can be shared |
| \`README.md\` | This documentation | Public |

## Key Generation

To generate new encryption keys, run:

\`\`\`bash
# Interactive mode (recommended)
pnpm run generate:encryption-keys

# With passphrase argument
pnpm run generate:encryption-keys --passphrase "your-secure-passphrase"
\`\`\`

### Passphrase Requirements

- Minimum 16 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## Environment Variables

Set the following environment variables in your \`.env\` file:

\`\`\`env
# Path to private key file (optional, defaults to config path)
ENCRYPTION_PRIVATE_KEY_PATH=./src/config/encryption-keys/private-key.json

# Path to public key file (optional, defaults to config path)
ENCRYPTION_PUBLIC_KEY_PATH=./src/config/encryption-keys/public-key.json

# Passphrase for decrypting the private key
ENCRYPTION_KEY_PASSPHRASE=your-secure-passphrase
\`\`\`

## Security Notes

1. **NEVER** commit \`private-key.json\` to version control
2. Store the passphrase in a secure secrets manager (not in .env for production)
3. Rotate keys every 90 days
4. Keep backup of keys in secure location
5. Access to private key should be restricted to authorized personnel only

## Usage in Code

\`\`\`typescript
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
\`\`\`

## Key Rotation

When rotating keys:

1. Generate new key pair
2. Re-encrypt all existing data with new keys
3. Update environment variables
4. Securely delete old keys after verification

## File Location

The encryption service looks for keys at:
- Private key: \`./src/config/encryption-keys/private-key.json\`
- Public key: \`./src/config/encryption-keys/public-key.json\`

Relative to the \`root_src\` directory.

## Troubleshooting

### Error: Unable to decrypt private key

- Verify the passphrase is correct
- Ensure the private key file is not corrupted
- Check file permissions

### Error: Key file not found

- Run \`pnpm run generate:encryption-keys\` to generate keys
- Verify file paths in environment variables

## Related Documentation

- [Technical Plan](../docs/jobs-user-encryption-cron-technical-plan.md)
- [Configuration Guide](../docs/configuration-environment-setup-guide.md)
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log(`README saved to: ${readmePath}`);
}

/**
 * Creates .gitignore for the encryption-keys directory
 */
function createGitignore() {
  const gitignorePath = path.join(CONFIG.outputDir, '.gitignore');
  const gitignoreContent = `# Ignore private key - NEVER commit this
private-key.json

# Keep public key and README
!public-key.json
!README.md
!.gitignore
`;

  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log(`.gitignore created at: ${gitignorePath}`);
}

/**
 * Verifies the generated keys work correctly
 * @param {{ publicKey: string, privateKey: string }} keys - Key pair
 * @param {string} passphrase - Passphrase
 * @returns {boolean} Verification result
 */
function verifyKeys(keys, passphrase) {
  console.log('Verifying key pair...');

  try {
    // Test encryption/decryption
    const testData = 'Test encryption verification';

    // Import public key
    const publicKey = crypto.createPublicKey(keys.publicKey);

    // Import private key with passphrase
    const privateKey = crypto.createPrivateKey({
      key: keys.privateKey,
      passphrase: passphrase,
    });

    // Encrypt with public key
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(testData),
    );

    // Decrypt with private key
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      encrypted,
    );

    const success = decrypted.toString() === testData;

    if (success) {
      console.log('Key pair verification: SUCCESS');
    } else {
      console.error(
        'Key pair verification: FAILED - Decrypted data does not match',
      );
    }

    return success;
  } catch (error) {
    console.error('Key pair verification: FAILED');
    console.error(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Parses command line arguments
 * @returns {{ passphrase?: string }} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--passphrase' && args[i + 1]) {
      result.passphrase = args[i + 1];
      i++;
    }
  }

  return result;
}

/**
 * Main execution function
 */
async function main() {
  console.log('');
  console.log('========================================');
  console.log('  Encryption Key Generation Script');
  console.log('========================================');
  console.log('');

  const args = parseArgs();
  let passphrase = args.passphrase;

  // If passphrase not provided via args, prompt user
  if (!passphrase) {
    const rl = createReadlineInterface();

    console.log('Enter a secure passphrase for the private key.');
    console.log('Requirements:');
    console.log('  - Minimum 16 characters');
    console.log('  - At least one uppercase letter');
    console.log('  - At least one lowercase letter');
    console.log('  - At least one number');
    console.log('  - At least one special character');
    console.log('');

    passphrase = await promptPassword(rl, 'Passphrase: ');
    const confirmPassphrase = await promptPassword(rl, 'Confirm passphrase: ');

    rl.close();

    if (passphrase !== confirmPassphrase) {
      console.error('');
      console.error('ERROR: Passphrases do not match');
      process.exit(1);
    }
  }

  // Validate passphrase
  const validation = validatePassphrase(passphrase);
  if (!validation.valid) {
    console.error('');
    console.error('ERROR: Invalid passphrase');
    validation.errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log('');

  // Ensure output directory exists
  ensureOutputDirectory();

  // Generate keys
  const keys = generateKeyPair(passphrase);

  // Verify keys
  const verified = verifyKeys(keys, passphrase);
  if (!verified) {
    console.error('Key verification failed. Aborting.');
    process.exit(1);
  }

  // Save keys to files
  saveKeysToFiles(keys);

  // Create README
  createReadme();

  // Create .gitignore
  createGitignore();

  console.log('');
  console.log('========================================');
  console.log('  Key Generation Complete');
  console.log('========================================');
  console.log('');
  console.log('IMPORTANT:');
  console.log('1. Store the passphrase securely');
  console.log('2. Add ENCRYPTION_KEY_PASSPHRASE to your .env file');
  console.log('3. NEVER commit private-key.json to version control');
  console.log('');
}

// Run main function
main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});

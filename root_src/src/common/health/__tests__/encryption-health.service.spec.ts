/**
 * Encryption Health Service Unit Tests
 *
 * Comprehensive test suite for the EncryptionHealthService.
 * Covers positive cases, negative cases, and edge cases.
 *
 * @module Common/Health/Tests
 * @version 1.0.0
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  EncryptionHealthService,
  validateEncryptionKeysHealth,
} from '../services/encryption-health.service';
import {
  ENCRYPTION_KEY_NAMES,
  ENCRYPTION_ENV_VARS,
  ENCRYPTION_HEALTH_ERROR_CODES,
  KEY_CONFIG,
} from '../constants/encryption-health.constants';

// Test configuration
const TEST_PASSPHRASE = 'TestPassphrase123!@#';
const WRONG_PASSPHRASE = 'WrongPassphrase456!@#';
const TEST_DIR = path.join(__dirname, 'temp-health-keys');

/**
 * Generate test RSA key pair
 */
function generateTestKeys(passphrase: string): {
  publicKey: string;
  privateKey: string;
} {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: KEY_CONFIG.RSA_KEY_SIZE,
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
  return { publicKey, privateKey };
}

/**
 * Write key files to test directory
 */
function writeTestKeys(
  testDir: string,
  publicKey: string,
  privateKey: string,
): void {
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(testDir, 'public-key.json'),
    JSON.stringify({ [ENCRYPTION_KEY_NAMES.PUBLIC]: publicKey }),
  );

  fs.writeFileSync(
    path.join(testDir, 'private-key.json'),
    JSON.stringify({ [ENCRYPTION_KEY_NAMES.PRIVATE]: privateKey }),
  );
}

/**
 * Clean up test directory
 */
function cleanupTestDir(testDir: string): void {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true });
  }
}

describe('EncryptionHealthService', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let testKeys: { publicKey: string; privateKey: string };

  beforeAll(() => {
    // Generate test keys
    testKeys = generateTestKeys(TEST_PASSPHRASE);
  });

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Clean up any existing test directory
    cleanupTestDir(TEST_DIR);
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;

    // Clean up test directory
    cleanupTestDir(TEST_DIR);
  });

  // ====================
  // POSITIVE TEST CASES
  // ====================

  describe('Positive Test Cases - checkKeysExist()', () => {
    it('should return true when both key files exist', () => {
      // Setup
      writeTestKeys(TEST_DIR, testKeys.publicKey, testKeys.privateKey);
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PASSPHRASE] = TEST_PASSPHRASE;

      const service = new EncryptionHealthService();

      // Act
      const result = service.checkKeysExist();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('Positive Test Cases - validatePassphrase()', () => {
    it('should return true when passphrase is correct', async () => {
      // Setup
      writeTestKeys(TEST_DIR, testKeys.publicKey, testKeys.privateKey);
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PASSPHRASE] = TEST_PASSPHRASE;

      const service = new EncryptionHealthService();

      // Act
      const result = await service.validatePassphrase();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('Positive Test Cases - checkHealth()', () => {
    it('should return healthy when all validations pass', async () => {
      // Setup
      writeTestKeys(TEST_DIR, testKeys.publicKey, testKeys.privateKey);
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PASSPHRASE] = TEST_PASSPHRASE;

      const service = new EncryptionHealthService();

      // Act
      const result = await service.checkHealth();

      // Assert
      expect(result.isHealthy).toBe(true);
      expect(result.publicKeyExists).toBe(true);
      expect(result.privateKeyExists).toBe(true);
      expect(result.passphraseValid).toBe(true);
      expect(result.errorCode).toBeUndefined();
      expect(result.errorMessage).toBeUndefined();
      expect(result.checkedAt).toBeDefined();
    });

    it('should return healthy when skipPassphraseValidation is true and keys exist', async () => {
      // Setup
      writeTestKeys(TEST_DIR, testKeys.publicKey, testKeys.privateKey);
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      // No passphrase set - but validation is skipped

      const service = new EncryptionHealthService();

      // Act
      const result = await service.checkHealth({
        skipPassphraseValidation: true,
      });

      // Assert
      expect(result.isHealthy).toBe(true);
      expect(result.publicKeyExists).toBe(true);
      expect(result.privateKeyExists).toBe(true);
    });

    it('should include timestamp in result', async () => {
      // Setup
      writeTestKeys(TEST_DIR, testKeys.publicKey, testKeys.privateKey);
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PASSPHRASE] = TEST_PASSPHRASE;

      const service = new EncryptionHealthService();
      const beforeCheck = new Date();

      // Act
      const result = await service.checkHealth();

      // Assert
      const checkedAtDate = new Date(result.checkedAt);
      expect(checkedAtDate.getTime()).toBeGreaterThanOrEqual(
        beforeCheck.getTime(),
      );
    });
  });

  describe('Positive Test Cases - checkPublicKeyExists()', () => {
    it('should return true when public key file exists', () => {
      // Setup
      writeTestKeys(TEST_DIR, testKeys.publicKey, testKeys.privateKey);
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );

      const service = new EncryptionHealthService();

      // Act
      const result = service.checkPublicKeyExists();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('Positive Test Cases - checkPrivateKeyExists()', () => {
    it('should return true when private key file exists', () => {
      // Setup
      writeTestKeys(TEST_DIR, testKeys.publicKey, testKeys.privateKey);
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );

      const service = new EncryptionHealthService();

      // Act
      const result = service.checkPrivateKeyExists();

      // Assert
      expect(result).toBe(true);
    });
  });

  // ====================
  // NEGATIVE TEST CASES
  // ====================

  describe('Negative Test Cases - checkKeysExist()', () => {
    it('should return false when public key file is missing', () => {
      // Setup - only write private key
      if (!fs.existsSync(TEST_DIR)) {
        fs.mkdirSync(TEST_DIR, { recursive: true });
      }
      fs.writeFileSync(
        path.join(TEST_DIR, 'private-key.json'),
        JSON.stringify({ [ENCRYPTION_KEY_NAMES.PRIVATE]: testKeys.privateKey }),
      );
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );

      const service = new EncryptionHealthService();

      // Act
      const result = service.checkKeysExist();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when private key file is missing', () => {
      // Setup - only write public key
      if (!fs.existsSync(TEST_DIR)) {
        fs.mkdirSync(TEST_DIR, { recursive: true });
      }
      fs.writeFileSync(
        path.join(TEST_DIR, 'public-key.json'),
        JSON.stringify({ [ENCRYPTION_KEY_NAMES.PUBLIC]: testKeys.publicKey }),
      );
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );

      const service = new EncryptionHealthService();

      // Act
      const result = service.checkKeysExist();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when both key files are missing', () => {
      // Setup - no key files
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );

      const service = new EncryptionHealthService();

      // Act
      const result = service.checkKeysExist();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Negative Test Cases - validatePassphrase()', () => {
    it('should return false when passphrase is incorrect', async () => {
      // Setup
      writeTestKeys(TEST_DIR, testKeys.publicKey, testKeys.privateKey);
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PASSPHRASE] = WRONG_PASSPHRASE;

      const service = new EncryptionHealthService();

      // Act
      const result = await service.validatePassphrase();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when passphrase is not set', async () => {
      // Setup
      writeTestKeys(TEST_DIR, testKeys.publicKey, testKeys.privateKey);
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      delete process.env[ENCRYPTION_ENV_VARS.PASSPHRASE];

      const service = new EncryptionHealthService();

      // Act
      const result = await service.validatePassphrase();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when key files are missing', async () => {
      // Setup - no key files
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PASSPHRASE] = TEST_PASSPHRASE;

      const service = new EncryptionHealthService();

      // Act
      const result = await service.validatePassphrase();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Negative Test Cases - checkHealth()', () => {
    it('should return unhealthy when both key files are missing', async () => {
      // Setup
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PASSPHRASE] = TEST_PASSPHRASE;

      const service = new EncryptionHealthService();

      // Act
      const result = await service.checkHealth();

      // Assert
      expect(result.isHealthy).toBe(false);
      expect(result.errorCode).toBe(
        ENCRYPTION_HEALTH_ERROR_CODES.KEYS_NOT_FOUND,
      );
      expect(result.publicKeyExists).toBe(false);
      expect(result.privateKeyExists).toBe(false);
    });

    it('should return unhealthy when public key file is missing', async () => {
      // Setup - only write private key
      if (!fs.existsSync(TEST_DIR)) {
        fs.mkdirSync(TEST_DIR, { recursive: true });
      }
      fs.writeFileSync(
        path.join(TEST_DIR, 'private-key.json'),
        JSON.stringify({ [ENCRYPTION_KEY_NAMES.PRIVATE]: testKeys.privateKey }),
      );
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PASSPHRASE] = TEST_PASSPHRASE;

      const service = new EncryptionHealthService();

      // Act
      const result = await service.checkHealth();

      // Assert
      expect(result.isHealthy).toBe(false);
      expect(result.errorCode).toBe(
        ENCRYPTION_HEALTH_ERROR_CODES.PUBLIC_KEY_NOT_FOUND,
      );
      expect(result.publicKeyExists).toBe(false);
      expect(result.privateKeyExists).toBe(true);
    });

    it('should return unhealthy when private key file is missing', async () => {
      // Setup - only write public key
      if (!fs.existsSync(TEST_DIR)) {
        fs.mkdirSync(TEST_DIR, { recursive: true });
      }
      fs.writeFileSync(
        path.join(TEST_DIR, 'public-key.json'),
        JSON.stringify({ [ENCRYPTION_KEY_NAMES.PUBLIC]: testKeys.publicKey }),
      );
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PASSPHRASE] = TEST_PASSPHRASE;

      const service = new EncryptionHealthService();

      // Act
      const result = await service.checkHealth();

      // Assert
      expect(result.isHealthy).toBe(false);
      expect(result.errorCode).toBe(
        ENCRYPTION_HEALTH_ERROR_CODES.PRIVATE_KEY_NOT_FOUND,
      );
      expect(result.publicKeyExists).toBe(true);
      expect(result.privateKeyExists).toBe(false);
    });

    it('should return unhealthy when passphrase is not set', async () => {
      // Setup
      writeTestKeys(TEST_DIR, testKeys.publicKey, testKeys.privateKey);
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      delete process.env[ENCRYPTION_ENV_VARS.PASSPHRASE];

      const service = new EncryptionHealthService();

      // Act
      const result = await service.checkHealth();

      // Assert
      expect(result.isHealthy).toBe(false);
      expect(result.errorCode).toBe(
        ENCRYPTION_HEALTH_ERROR_CODES.PASSPHRASE_NOT_SET,
      );
      expect(result.publicKeyExists).toBe(true);
      expect(result.privateKeyExists).toBe(true);
      expect(result.passphraseValid).toBe(false);
    });

    it('should return unhealthy when passphrase is incorrect', async () => {
      // Setup
      writeTestKeys(TEST_DIR, testKeys.publicKey, testKeys.privateKey);
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PASSPHRASE] = WRONG_PASSPHRASE;

      const service = new EncryptionHealthService();

      // Act
      const result = await service.checkHealth();

      // Assert
      expect(result.isHealthy).toBe(false);
      expect(result.publicKeyExists).toBe(true);
      expect(result.privateKeyExists).toBe(true);
      expect(result.passphraseValid).toBe(false);
    });
  });

  describe('Negative Test Cases - throwFatalError()', () => {
    it('should throw error with formatted message', () => {
      // Setup
      const service = new EncryptionHealthService();

      // Act & Assert
      expect(() => {
        service.throwFatalError('ERR_TEST', 'Test error message');
      }).toThrow(
        '[EncryptionHealthService] FATAL: Test error message (ERR_TEST)',
      );
    });
  });

  // ====================
  // EDGE CASES
  // ====================

  describe('Edge Cases', () => {
    it('should handle corrupted public key JSON file', async () => {
      // Setup - write invalid JSON
      if (!fs.existsSync(TEST_DIR)) {
        fs.mkdirSync(TEST_DIR, { recursive: true });
      }
      fs.writeFileSync(path.join(TEST_DIR, 'public-key.json'), 'invalid json');
      fs.writeFileSync(
        path.join(TEST_DIR, 'private-key.json'),
        JSON.stringify({ [ENCRYPTION_KEY_NAMES.PRIVATE]: testKeys.privateKey }),
      );
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PASSPHRASE] = TEST_PASSPHRASE;

      const service = new EncryptionHealthService();

      // Act
      const result = await service.checkHealth();

      // Assert
      expect(result.isHealthy).toBe(false);
      expect(result.passphraseValid).toBe(false);
    });

    it('should handle corrupted private key JSON file', async () => {
      // Setup - write invalid JSON
      if (!fs.existsSync(TEST_DIR)) {
        fs.mkdirSync(TEST_DIR, { recursive: true });
      }
      fs.writeFileSync(
        path.join(TEST_DIR, 'public-key.json'),
        JSON.stringify({ [ENCRYPTION_KEY_NAMES.PUBLIC]: testKeys.publicKey }),
      );
      fs.writeFileSync(path.join(TEST_DIR, 'private-key.json'), 'invalid json');
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PASSPHRASE] = TEST_PASSPHRASE;

      const service = new EncryptionHealthService();

      // Act
      const result = await service.checkHealth();

      // Assert
      expect(result.isHealthy).toBe(false);
      expect(result.passphraseValid).toBe(false);
    });

    it('should handle empty public key in JSON file', async () => {
      // Setup - write empty key
      if (!fs.existsSync(TEST_DIR)) {
        fs.mkdirSync(TEST_DIR, { recursive: true });
      }
      fs.writeFileSync(
        path.join(TEST_DIR, 'public-key.json'),
        JSON.stringify({ [ENCRYPTION_KEY_NAMES.PUBLIC]: '' }),
      );
      fs.writeFileSync(
        path.join(TEST_DIR, 'private-key.json'),
        JSON.stringify({ [ENCRYPTION_KEY_NAMES.PRIVATE]: testKeys.privateKey }),
      );
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PASSPHRASE] = TEST_PASSPHRASE;

      const service = new EncryptionHealthService();

      // Act
      const result = await service.checkHealth();

      // Assert
      expect(result.isHealthy).toBe(false);
      expect(result.passphraseValid).toBe(false);
    });

    it('should handle missing key property in JSON file', async () => {
      // Setup - write JSON without the expected key property
      if (!fs.existsSync(TEST_DIR)) {
        fs.mkdirSync(TEST_DIR, { recursive: true });
      }
      fs.writeFileSync(
        path.join(TEST_DIR, 'public-key.json'),
        JSON.stringify({ wrongKeyName: testKeys.publicKey }),
      );
      fs.writeFileSync(
        path.join(TEST_DIR, 'private-key.json'),
        JSON.stringify({ [ENCRYPTION_KEY_NAMES.PRIVATE]: testKeys.privateKey }),
      );
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PASSPHRASE] = TEST_PASSPHRASE;

      const service = new EncryptionHealthService();

      // Act
      const result = await service.checkHealth();

      // Assert
      expect(result.isHealthy).toBe(false);
      expect(result.passphraseValid).toBe(false);
    });

    it('should use default paths when environment variables are not set', () => {
      // Setup - don't set path environment variables
      delete process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH];
      delete process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH];
      process.env[ENCRYPTION_ENV_VARS.PASSPHRASE] = TEST_PASSPHRASE;

      const service = new EncryptionHealthService();

      // Act - checkKeysExist will use default paths
      const result = service.checkKeysExist();

      // Assert - depends on whether default paths exist in the actual project
      expect(typeof result).toBe('boolean');
    });
  });

  // ====================
  // VALIDATION FUNCTION TESTS
  // ====================

  describe('validateEncryptionKeysHealth()', () => {
    it('should not throw when health check passes', async () => {
      // Setup
      writeTestKeys(TEST_DIR, testKeys.publicKey, testKeys.privateKey);
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PASSPHRASE] = TEST_PASSPHRASE;

      // Act & Assert
      await expect(validateEncryptionKeysHealth()).resolves.not.toThrow();
    });

    it('should throw when keys are missing', async () => {
      // Setup
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PASSPHRASE] = TEST_PASSPHRASE;

      // Act & Assert
      await expect(validateEncryptionKeysHealth()).rejects.toThrow('FATAL');
    });

    it('should throw when passphrase is incorrect', async () => {
      // Setup
      writeTestKeys(TEST_DIR, testKeys.publicKey, testKeys.privateKey);
      process.env[ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH] = path.join(
        TEST_DIR,
        'public-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH] = path.join(
        TEST_DIR,
        'private-key.json',
      );
      process.env[ENCRYPTION_ENV_VARS.PASSPHRASE] = WRONG_PASSPHRASE;

      // Act & Assert
      await expect(validateEncryptionKeysHealth()).rejects.toThrow('FATAL');
    });
  });
});

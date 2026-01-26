/**
 * Encryption Service Unit Tests
 *
 * Comprehensive test suite for the EncryptionService.
 * Covers positive cases, negative cases, and edge cases.
 *
 * @module UserEncryption/Tests
 * @version 1.0.0
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getLoggerToken } from 'nestjs-pino';
import { EncryptionService } from '../services/encryption.service';
import {
  ENCRYPTION_ALGORITHMS,
  KEY_CONFIG,
  KEY_NAMES,
  ENV_VARS,
} from '../constants/encryption.constants';
import { IEncryptedData } from '../interfaces/encryption.interfaces';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  setContext: jest.fn(),
};

// Generate test keys
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

describe('EncryptionService', () => {
  let service: EncryptionService;
  const testPassphrase = 'TestPassphrase123!@#';
  const testDir = path.join(__dirname, 'temp-keys');
  let testKeys: { publicKey: string; privateKey: string };

  beforeAll(() => {
    // Generate test keys
    testKeys = generateTestKeys(testPassphrase);

    // Create temp directory for keys
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Write public key
    fs.writeFileSync(
      path.join(testDir, 'public-key.json'),
      JSON.stringify({ [KEY_NAMES.PUBLIC]: testKeys.publicKey }),
    );

    // Write private key
    fs.writeFileSync(
      path.join(testDir, 'private-key.json'),
      JSON.stringify({ [KEY_NAMES.PRIVATE]: testKeys.privateKey }),
    );
  });

  afterAll(() => {
    // Clean up temp directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              switch (key) {
                case ENV_VARS.PUBLIC_KEY_PATH:
                  return path.join(testDir, 'public-key.json');
                case ENV_VARS.PRIVATE_KEY_PATH:
                  return path.join(testDir, 'private-key.json');
                case ENV_VARS.PASSPHRASE:
                  return testPassphrase;
                default:
                  return defaultValue;
              }
            }),
          },
        },
        {
          provide: getLoggerToken(EncryptionService.name),
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);

    // Clear mock calls
    jest.clearAllMocks();
  });

  // ====================
  // POSITIVE TEST CASES
  // ====================

  describe('Positive Test Cases - encrypt()', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should encrypt a simple string successfully', () => {
      const plaintext = 'Hello, World!';
      const encrypted = service.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();
      expect(encrypted.encryptedKey).toBeDefined();
      expect(encrypted.algorithm).toBe(ENCRYPTION_ALGORITHMS.AES);
      expect(encrypted.encryptedAt).toBeDefined();
    });

    it('should encrypt an email address', () => {
      const email = 'user@example.com';
      const encrypted = service.encrypt(email);

      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.ciphertext).not.toBe(email);
    });

    it('should encrypt a phone number', () => {
      const phone = '+62812345678';
      const encrypted = service.encrypt(phone);

      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.ciphertext).not.toBe(phone);
    });

    it('should encrypt a full name', () => {
      const name = 'John Doe';
      const encrypted = service.encrypt(name);

      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.ciphertext).not.toBe(name);
    });

    it('should encrypt Indonesian name with special characters', () => {
      const name = 'Ahmad Syarif';
      const encrypted = service.encrypt(name);

      expect(encrypted.ciphertext).toBeDefined();
    });

    it('should encrypt a very long string (1000 characters)', () => {
      const longString = 'A'.repeat(1000);
      const encrypted = service.encrypt(longString);

      expect(encrypted.ciphertext).toBeDefined();
    });

    it('should encrypt string with Unicode characters', () => {
      const unicode = 'Test data';
      const encrypted = service.encrypt(unicode);

      expect(encrypted.ciphertext).toBeDefined();
    });

    it('should encrypt string with newlines', () => {
      const multiline = 'Line 1\nLine 2\nLine 3';
      const encrypted = service.encrypt(multiline);

      expect(encrypted.ciphertext).toBeDefined();
    });

    it('should encrypt string with special characters', () => {
      const special = 'Test!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = service.encrypt(special);

      expect(encrypted.ciphertext).toBeDefined();
    });

    it('should encrypt JSON string', () => {
      const json = JSON.stringify({ name: 'Test', value: 123 });
      const encrypted = service.encrypt(json);

      expect(encrypted.ciphertext).toBeDefined();
    });

    it('should generate unique IV for each encryption', () => {
      const plaintext = 'Same text';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should generate unique encrypted key for each encryption', () => {
      const plaintext = 'Same text';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      expect(encrypted1.encryptedKey).not.toBe(encrypted2.encryptedKey);
    });

    it('should generate different ciphertext for same plaintext', () => {
      const plaintext = 'Same text';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
    });

    it('should include timestamp in encrypted data', () => {
      const encrypted = service.encrypt('test');
      const timestamp = new Date(encrypted.encryptedAt);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should encrypt single character', () => {
      const encrypted = service.encrypt('A');

      expect(encrypted.ciphertext).toBeDefined();
    });

    it('should encrypt whitespace-only string', () => {
      const encrypted = service.encrypt('   ');

      expect(encrypted.ciphertext).toBeDefined();
    });
  });

  describe('Positive Test Cases - decrypt()', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should decrypt simple string correctly', () => {
      const plaintext = 'Hello, World!';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt email address correctly', () => {
      const email = 'user@example.com';
      const encrypted = service.encrypt(email);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(email);
    });

    it('should decrypt phone number correctly', () => {
      const phone = '+62812345678';
      const encrypted = service.encrypt(phone);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(phone);
    });

    it('should decrypt full name correctly', () => {
      const name = 'John Doe';
      const encrypted = service.encrypt(name);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(name);
    });

    it('should decrypt Indonesian name correctly', () => {
      const name = 'Ahmad Syarif';
      const encrypted = service.encrypt(name);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(name);
    });

    it('should decrypt very long string correctly', () => {
      const longString = 'A'.repeat(1000);
      const encrypted = service.encrypt(longString);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(longString);
    });

    it('should decrypt Unicode characters correctly', () => {
      const unicode = 'Test data';
      const encrypted = service.encrypt(unicode);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(unicode);
    });

    it('should decrypt multiline string correctly', () => {
      const multiline = 'Line 1\nLine 2\nLine 3';
      const encrypted = service.encrypt(multiline);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(multiline);
    });

    it('should decrypt special characters correctly', () => {
      const special = 'Test!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = service.encrypt(special);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(special);
    });

    it('should decrypt JSON string correctly', () => {
      const json = JSON.stringify({ name: 'Test', value: 123 });
      const encrypted = service.encrypt(json);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(json);
    });

    it('should decrypt single character correctly', () => {
      const char = 'A';
      const encrypted = service.encrypt(char);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(char);
    });

    it('should decrypt whitespace-only string correctly', () => {
      const whitespace = '   ';
      const encrypted = service.encrypt(whitespace);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(whitespace);
    });

    it('should handle round-trip encryption/decryption multiple times', () => {
      const original = 'Test data for multiple rounds';

      for (let i = 0; i < 10; i++) {
        const encrypted = service.encrypt(original);
        const decrypted = service.decrypt(encrypted);
        expect(decrypted).toBe(original);
      }
    });

    it('should decrypt data encrypted with different IV correctly', () => {
      const plaintext = 'Same text';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      expect(service.decrypt(encrypted1)).toBe(plaintext);
      expect(service.decrypt(encrypted2)).toBe(plaintext);
    });
  });

  describe('Positive Test Cases - validateKeys()', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should return true when keys are valid', () => {
      const isValid = service.validateKeys();

      expect(isValid).toBe(true);
    });

    it('should validate keys successfully after initialization', async () => {
      await service.initializeKeys();
      const isValid = service.validateKeys();

      expect(isValid).toBe(true);
    });
  });

  describe('Positive Test Cases - isReady()', () => {
    it('should return true after initialization', async () => {
      await service.onModuleInit();

      expect(service.isReady()).toBe(true);
    });

    it('should return true after manual key initialization', async () => {
      await service.initializeKeys();

      expect(service.isReady()).toBe(true);
    });
  });

  // ====================
  // NEGATIVE TEST CASES
  // ====================

  describe('Negative Test Cases - encrypt()', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should throw error when encrypting empty string', () => {
      expect(() => service.encrypt('')).toThrow(
        'Cannot encrypt empty or null data',
      );
    });

    it('should throw error when encrypting null', () => {
      expect(() => service.encrypt(null as unknown as string)).toThrow();
    });

    it('should throw error when encrypting undefined', () => {
      expect(() => service.encrypt(undefined as unknown as string)).toThrow();
    });

    it('should throw error when service is not initialized', async () => {
      // Create new service instance without initialization
      const uninitializedModule: TestingModule = await Test.createTestingModule(
        {
          providers: [
            EncryptionService,
            {
              provide: ConfigService,
              useValue: {
                get: jest.fn(() => undefined),
              },
            },
            {
              provide: getLoggerToken(EncryptionService.name),
              useValue: mockLogger,
            },
          ],
        },
      ).compile();

      const uninitializedService =
        uninitializedModule.get<EncryptionService>(EncryptionService);

      expect(() => uninitializedService.encrypt('test')).toThrow(
        'Encryption service not initialized',
      );
    });

    it('should throw error with non-string input (number)', () => {
      expect(() => service.encrypt(123 as unknown as string)).toThrow();
    });

    it('should throw error with non-string input (object)', () => {
      expect(() => service.encrypt({} as unknown as string)).toThrow();
    });

    it('should throw error with non-string input (array)', () => {
      expect(() => service.encrypt([] as unknown as string)).toThrow();
    });
  });

  describe('Negative Test Cases - decrypt()', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should throw error when decrypting null', () => {
      expect(() => service.decrypt(null as unknown as IEncryptedData)).toThrow(
        'Invalid encrypted data structure',
      );
    });

    it('should throw error when decrypting undefined', () => {
      expect(() =>
        service.decrypt(undefined as unknown as IEncryptedData),
      ).toThrow('Invalid encrypted data structure');
    });

    it('should throw error when decrypting empty object', () => {
      expect(() => service.decrypt({} as IEncryptedData)).toThrow(
        'Invalid encrypted data structure',
      );
    });

    it('should throw error when ciphertext is missing', () => {
      const invalidData = {
        iv: 'test',
        tag: 'test',
        encryptedKey: 'test',
        algorithm: 'aes-256-gcm',
        encryptedAt: new Date().toISOString(),
      } as IEncryptedData;

      expect(() => service.decrypt(invalidData)).toThrow();
    });

    it('should throw error when IV is missing', () => {
      const encrypted = service.encrypt('test');
      const invalidData = { ...encrypted, iv: '' };

      expect(() => service.decrypt(invalidData)).toThrow();
    });

    it('should throw error when tag is missing', () => {
      const encrypted = service.encrypt('test');
      const invalidData = { ...encrypted, tag: '' };

      expect(() => service.decrypt(invalidData)).toThrow();
    });

    it('should throw error when encrypted key is missing', () => {
      const encrypted = service.encrypt('test');
      const invalidData = { ...encrypted, encryptedKey: '' };

      expect(() => service.decrypt(invalidData)).toThrow();
    });

    it('should throw error when ciphertext is corrupted', () => {
      const encrypted = service.encrypt('test');
      const corruptedData = { ...encrypted, ciphertext: 'corrupted' };

      expect(() => service.decrypt(corruptedData)).toThrow('Decryption failed');
    });

    it('should throw error when IV is corrupted', () => {
      const encrypted = service.encrypt('test');
      const corruptedData = { ...encrypted, iv: 'corrupted' };

      expect(() => service.decrypt(corruptedData)).toThrow('Decryption failed');
    });

    it('should throw error when tag is corrupted', () => {
      const encrypted = service.encrypt('test');
      const corruptedData = { ...encrypted, tag: 'corrupted' };

      expect(() => service.decrypt(corruptedData)).toThrow('Decryption failed');
    });

    it('should throw error when encrypted key is corrupted', () => {
      const encrypted = service.encrypt('test');
      const corruptedData = { ...encrypted, encryptedKey: 'corrupted' };

      expect(() => service.decrypt(corruptedData)).toThrow('Decryption failed');
    });

    it('should throw error when authentication tag verification fails', () => {
      const encrypted = service.encrypt('test');
      // Modify ciphertext to cause tag verification failure
      const buffer = Buffer.from(encrypted.ciphertext, 'base64');
      buffer[0] = buffer[0] ^ 0xff;
      const modifiedData = {
        ...encrypted,
        ciphertext: buffer.toString('base64'),
      };

      expect(() => service.decrypt(modifiedData)).toThrow('Decryption failed');
    });

    it('should throw error when service is not initialized', async () => {
      const uninitializedModule: TestingModule = await Test.createTestingModule(
        {
          providers: [
            EncryptionService,
            {
              provide: ConfigService,
              useValue: {
                get: jest.fn(() => undefined),
              },
            },
            {
              provide: getLoggerToken(EncryptionService.name),
              useValue: mockLogger,
            },
          ],
        },
      ).compile();

      const uninitializedService =
        uninitializedModule.get<EncryptionService>(EncryptionService);

      const fakeEncrypted: IEncryptedData = {
        ciphertext: 'test',
        iv: 'test',
        tag: 'test',
        encryptedKey: 'test',
        algorithm: 'aes-256-gcm',
        encryptedAt: new Date().toISOString(),
      };

      expect(() => uninitializedService.decrypt(fakeEncrypted)).toThrow(
        'Encryption service not initialized',
      );
    });

    it('should throw error with wrong key pair for decryption', async () => {
      // Generate different key pair
      const otherKeys = generateTestKeys('OtherPassphrase456!@#');
      const otherDir = path.join(__dirname, 'temp-keys-other');

      if (!fs.existsSync(otherDir)) {
        fs.mkdirSync(otherDir, { recursive: true });
      }

      fs.writeFileSync(
        path.join(otherDir, 'public-key.json'),
        JSON.stringify({ [KEY_NAMES.PUBLIC]: otherKeys.publicKey }),
      );
      fs.writeFileSync(
        path.join(otherDir, 'private-key.json'),
        JSON.stringify({ [KEY_NAMES.PRIVATE]: otherKeys.privateKey }),
      );

      try {
        // Encrypt with original service
        const encrypted = service.encrypt('test data');

        // Create service with different keys
        const otherModule: TestingModule = await Test.createTestingModule({
          providers: [
            EncryptionService,
            {
              provide: ConfigService,
              useValue: {
                get: jest.fn((key: string) => {
                  switch (key) {
                    case ENV_VARS.PUBLIC_KEY_PATH:
                      return path.join(otherDir, 'public-key.json');
                    case ENV_VARS.PRIVATE_KEY_PATH:
                      return path.join(otherDir, 'private-key.json');
                    case ENV_VARS.PASSPHRASE:
                      return 'OtherPassphrase456!@#';
                    default:
                      return undefined;
                  }
                }),
              },
            },
            {
              provide: getLoggerToken(EncryptionService.name),
              useValue: mockLogger,
            },
          ],
        }).compile();

        const otherService =
          otherModule.get<EncryptionService>(EncryptionService);
        await otherService.onModuleInit();

        // Try to decrypt with wrong key
        expect(() => otherService.decrypt(encrypted)).toThrow(
          'Decryption failed',
        );
      } finally {
        // Clean up
        if (fs.existsSync(otherDir)) {
          fs.rmSync(otherDir, { recursive: true });
        }
      }
    });
  });

  describe('Negative Test Cases - validateKeys()', () => {
    it('should return false when keys are not initialized', () => {
      const isValid = service.validateKeys();

      expect(isValid).toBe(false);
    });
  });

  describe('Negative Test Cases - Key Loading', () => {
    it('should handle missing public key file', async () => {
      const badModule: TestingModule = await Test.createTestingModule({
        providers: [
          EncryptionService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                switch (key) {
                  case ENV_VARS.PUBLIC_KEY_PATH:
                    return '/nonexistent/path/public-key.json';
                  case ENV_VARS.PRIVATE_KEY_PATH:
                    return path.join(testDir, 'private-key.json');
                  case ENV_VARS.PASSPHRASE:
                    return testPassphrase;
                  default:
                    return undefined;
                }
              }),
            },
          },
          {
            provide: getLoggerToken(EncryptionService.name),
            useValue: mockLogger,
          },
        ],
      }).compile();

      const badService = badModule.get<EncryptionService>(EncryptionService);

      // Should not throw during init, but should log error
      await badService.onModuleInit();
      expect(badService.isReady()).toBe(false);
    });

    it('should handle missing private key file', async () => {
      const badModule: TestingModule = await Test.createTestingModule({
        providers: [
          EncryptionService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                switch (key) {
                  case ENV_VARS.PUBLIC_KEY_PATH:
                    return path.join(testDir, 'public-key.json');
                  case ENV_VARS.PRIVATE_KEY_PATH:
                    return '/nonexistent/path/private-key.json';
                  case ENV_VARS.PASSPHRASE:
                    return testPassphrase;
                  default:
                    return undefined;
                }
              }),
            },
          },
          {
            provide: getLoggerToken(EncryptionService.name),
            useValue: mockLogger,
          },
        ],
      }).compile();

      const badService = badModule.get<EncryptionService>(EncryptionService);

      await badService.onModuleInit();
      expect(badService.isReady()).toBe(false);
    });

    it('should handle missing passphrase', async () => {
      const badModule: TestingModule = await Test.createTestingModule({
        providers: [
          EncryptionService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                switch (key) {
                  case ENV_VARS.PUBLIC_KEY_PATH:
                    return path.join(testDir, 'public-key.json');
                  case ENV_VARS.PRIVATE_KEY_PATH:
                    return path.join(testDir, 'private-key.json');
                  case ENV_VARS.PASSPHRASE:
                    return undefined; // Missing passphrase
                  default:
                    return undefined;
                }
              }),
            },
          },
          {
            provide: getLoggerToken(EncryptionService.name),
            useValue: mockLogger,
          },
        ],
      }).compile();

      const badService = badModule.get<EncryptionService>(EncryptionService);

      await badService.onModuleInit();
      expect(badService.isReady()).toBe(false);
    });

    it('should handle wrong passphrase', async () => {
      const badModule: TestingModule = await Test.createTestingModule({
        providers: [
          EncryptionService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                switch (key) {
                  case ENV_VARS.PUBLIC_KEY_PATH:
                    return path.join(testDir, 'public-key.json');
                  case ENV_VARS.PRIVATE_KEY_PATH:
                    return path.join(testDir, 'private-key.json');
                  case ENV_VARS.PASSPHRASE:
                    return 'WrongPassphrase!@#';
                  default:
                    return undefined;
                }
              }),
            },
          },
          {
            provide: getLoggerToken(EncryptionService.name),
            useValue: mockLogger,
          },
        ],
      }).compile();

      const badService = badModule.get<EncryptionService>(EncryptionService);

      await badService.onModuleInit();
      expect(badService.isReady()).toBe(false);
    });

    it('should handle invalid JSON in key file', async () => {
      const invalidDir = path.join(__dirname, 'temp-invalid-keys');
      if (!fs.existsSync(invalidDir)) {
        fs.mkdirSync(invalidDir, { recursive: true });
      }

      fs.writeFileSync(
        path.join(invalidDir, 'public-key.json'),
        'invalid json',
      );
      fs.writeFileSync(
        path.join(invalidDir, 'private-key.json'),
        JSON.stringify({ [KEY_NAMES.PRIVATE]: testKeys.privateKey }),
      );

      try {
        const badModule: TestingModule = await Test.createTestingModule({
          providers: [
            EncryptionService,
            {
              provide: ConfigService,
              useValue: {
                get: jest.fn((key: string) => {
                  switch (key) {
                    case ENV_VARS.PUBLIC_KEY_PATH:
                      return path.join(invalidDir, 'public-key.json');
                    case ENV_VARS.PRIVATE_KEY_PATH:
                      return path.join(invalidDir, 'private-key.json');
                    case ENV_VARS.PASSPHRASE:
                      return testPassphrase;
                    default:
                      return undefined;
                  }
                }),
              },
            },
            {
              provide: getLoggerToken(EncryptionService.name),
              useValue: mockLogger,
            },
          ],
        }).compile();

        const badService = badModule.get<EncryptionService>(EncryptionService);

        await badService.onModuleInit();
        expect(badService.isReady()).toBe(false);
      } finally {
        if (fs.existsSync(invalidDir)) {
          fs.rmSync(invalidDir, { recursive: true });
        }
      }
    });

    it('should handle key file with wrong property name', async () => {
      const wrongDir = path.join(__dirname, 'temp-wrong-keys');
      if (!fs.existsSync(wrongDir)) {
        fs.mkdirSync(wrongDir, { recursive: true });
      }

      fs.writeFileSync(
        path.join(wrongDir, 'public-key.json'),
        JSON.stringify({ WRONG_KEY_NAME: testKeys.publicKey }),
      );
      fs.writeFileSync(
        path.join(wrongDir, 'private-key.json'),
        JSON.stringify({ [KEY_NAMES.PRIVATE]: testKeys.privateKey }),
      );

      try {
        const badModule: TestingModule = await Test.createTestingModule({
          providers: [
            EncryptionService,
            {
              provide: ConfigService,
              useValue: {
                get: jest.fn((key: string) => {
                  switch (key) {
                    case ENV_VARS.PUBLIC_KEY_PATH:
                      return path.join(wrongDir, 'public-key.json');
                    case ENV_VARS.PRIVATE_KEY_PATH:
                      return path.join(wrongDir, 'private-key.json');
                    case ENV_VARS.PASSPHRASE:
                      return testPassphrase;
                    default:
                      return undefined;
                  }
                }),
              },
            },
            {
              provide: getLoggerToken(EncryptionService.name),
              useValue: mockLogger,
            },
          ],
        }).compile();

        const badService = badModule.get<EncryptionService>(EncryptionService);

        await badService.onModuleInit();
        expect(badService.isReady()).toBe(false);
      } finally {
        if (fs.existsSync(wrongDir)) {
          fs.rmSync(wrongDir, { recursive: true });
        }
      }
    });
  });

  // ====================
  // EDGE TEST CASES
  // ====================

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should handle maximum length string (10KB)', () => {
      const maxString = 'X'.repeat(10 * 1024);
      const encrypted = service.encrypt(maxString);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(maxString);
    });

    it('should handle string with null bytes', () => {
      const withNull = 'before\x00after';
      const encrypted = service.encrypt(withNull);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(withNull);
    });

    it('should handle string with control characters', () => {
      const withControl = 'Tab\tNewline\nCarriage\rFormfeed\f';
      const encrypted = service.encrypt(withControl);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(withControl);
    });

    it('should handle string with emoji', () => {
      const emoji = 'Hello World';
      const encrypted = service.encrypt(emoji);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(emoji);
    });

    it('should handle string with mixed encodings', () => {
      const mixed = 'English - Test';
      const encrypted = service.encrypt(mixed);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(mixed);
    });

    it('should handle SQL injection string', () => {
      const sqlInjection = "'; DROP TABLE users; --";
      const encrypted = service.encrypt(sqlInjection);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(sqlInjection);
    });

    it('should handle XSS attack string', () => {
      const xss = '<script>alert("XSS")</script>';
      const encrypted = service.encrypt(xss);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(xss);
    });

    it('should handle path traversal string', () => {
      const pathTraversal = '../../../etc/passwd';
      const encrypted = service.encrypt(pathTraversal);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(pathTraversal);
    });

    it('should produce base64 encoded output', () => {
      const encrypted = service.encrypt('test');

      // Check all outputs are valid base64
      expect(() => Buffer.from(encrypted.ciphertext, 'base64')).not.toThrow();
      expect(() => Buffer.from(encrypted.iv, 'base64')).not.toThrow();
      expect(() => Buffer.from(encrypted.tag, 'base64')).not.toThrow();
      expect(() => Buffer.from(encrypted.encryptedKey, 'base64')).not.toThrow();
    });

    it('should handle concurrent encryption calls', async () => {
      const promises = [];
      const plaintexts = [];

      for (let i = 0; i < 100; i++) {
        const plaintext = `Concurrent test ${i}`;
        plaintexts.push(plaintext);
        promises.push(Promise.resolve(service.encrypt(plaintext)));
      }

      const results = await Promise.all(promises);

      for (let i = 0; i < results.length; i++) {
        const decrypted = service.decrypt(results[i]);
        expect(decrypted).toBe(plaintexts[i]);
      }
    });

    it('should handle concurrent decryption calls', async () => {
      const encrypted = [];
      const plaintexts = [];

      for (let i = 0; i < 100; i++) {
        const plaintext = `Concurrent decrypt test ${i}`;
        plaintexts.push(plaintext);
        encrypted.push(service.encrypt(plaintext));
      }

      const promises = encrypted.map((e) =>
        Promise.resolve(service.decrypt(e)),
      );
      const results = await Promise.all(promises);

      for (let i = 0; i < results.length; i++) {
        expect(results[i]).toBe(plaintexts[i]);
      }
    });

    it('should maintain data integrity across serialization', () => {
      const plaintext = 'Test serialization';
      const encrypted = service.encrypt(plaintext);

      // Serialize to JSON and back
      const json = JSON.stringify(encrypted);
      const parsed = JSON.parse(json) as IEncryptedData;

      const decrypted = service.decrypt(parsed);
      expect(decrypted).toBe(plaintext);
    });
  });
});

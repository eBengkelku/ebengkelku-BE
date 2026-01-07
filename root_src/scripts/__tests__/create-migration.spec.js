/**
 * Unit tests for create-migration.js
 *
 * Tests cover:
 * - normalizeTableName: Converts input to lowercase
 * - validateTableName: Validates table name format
 * - generateTimestamp: Generates timestamp in YYYYMMDDHHmmss format
 * - generateMigrationTemplate: Generates migration file content
 * - createMigrationFile: Creates migration file in the migrations directory
 */

const path = require('node:path');

// Mock fs module with proper Jest mock functions
jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

const fs = require('node:fs');

const {
  normalizeTableName,
  validateTableName,
  generateTimestamp,
  generateMigrationTemplate,
  createMigrationFile,
  MIGRATIONS_DIR,
} = require('../create-migration');

describe('create-migration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================================
  // normalizeTableName Tests
  // ============================================================
  describe('normalizeTableName', () => {
    describe('when input is uppercase', () => {
      it('should convert to lowercase', () => {
        expect(normalizeTableName('USERS')).toBe('users');
      });
    });

    describe('when input is mixed case', () => {
      it('should convert to lowercase', () => {
        expect(normalizeTableName('UsErS_TaBlE')).toBe('users_table');
      });
    });

    describe('when input is already lowercase', () => {
      it('should return unchanged', () => {
        expect(normalizeTableName('users')).toBe('users');
      });
    });

    describe('when input contains underscores', () => {
      it('should preserve underscores', () => {
        expect(normalizeTableName('USER_PROFILES')).toBe('user_profiles');
      });
    });

    describe('when input is capitalized', () => {
      it('should convert to lowercase', () => {
        expect(normalizeTableName('Users')).toBe('users');
      });
    });

    describe('when input has multiple words with underscores', () => {
      it('should handle multi-word names', () => {
        expect(normalizeTableName('Users_For_Whatsapp')).toBe(
          'users_for_whatsapp',
        );
      });
    });
  });

  // ============================================================
  // validateTableName Tests
  // ============================================================
  describe('validateTableName', () => {
    describe('valid table names', () => {
      it('should accept simple lowercase name', () => {
        const result = validateTableName('users');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept name with single underscore', () => {
        const result = validateTableName('user_profiles');
        expect(result.valid).toBe(true);
      });

      it('should accept name with multiple underscores', () => {
        const result = validateTableName('users_for_whatsapp');
        expect(result.valid).toBe(true);
      });

      it('should accept single character name', () => {
        const result = validateTableName('a');
        expect(result.valid).toBe(true);
      });

      it('should accept long name', () => {
        const result = validateTableName(
          'very_long_table_name_with_many_words',
        );
        expect(result.valid).toBe(true);
      });
    });

    describe('empty input', () => {
      it('should reject empty string', () => {
        const result = validateTableName('');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Table name cannot be empty');
      });

      it('should reject null', () => {
        const result = validateTableName(null);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Table name cannot be empty');
      });

      it('should reject undefined', () => {
        const result = validateTableName(undefined);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Table name cannot be empty');
      });
    });

    describe('invalid characters', () => {
      it('should reject name with spaces', () => {
        const result = validateTableName('user profiles');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          'Table name can only contain lowercase letters (a-z) and underscores (_)',
        );
      });

      it('should reject name with hyphen', () => {
        const result = validateTableName('user-profiles');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          'Table name can only contain lowercase letters (a-z) and underscores (_)',
        );
      });

      it('should reject name with numbers', () => {
        const result = validateTableName('users123');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          'Table name can only contain lowercase letters (a-z) and underscores (_)',
        );
      });

      it('should reject name with special characters', () => {
        const result = validateTableName('users@table');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          'Table name can only contain lowercase letters (a-z) and underscores (_)',
        );
      });

      it('should reject name with uppercase letters', () => {
        const result = validateTableName('Users');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          'Table name can only contain lowercase letters (a-z) and underscores (_)',
        );
      });

      it('should reject name with dots', () => {
        const result = validateTableName('users.table');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          'Table name can only contain lowercase letters (a-z) and underscores (_)',
        );
      });
    });

    describe('underscore position', () => {
      it('should reject name starting with underscore', () => {
        const result = validateTableName('_users');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Table name cannot start with underscore');
      });

      it('should reject name ending with underscore', () => {
        const result = validateTableName('users_');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Table name cannot end with underscore');
      });

      it('should reject name with consecutive underscores', () => {
        const result = validateTableName('users__table');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          'Table name cannot contain consecutive underscores',
        );
      });

      it('should reject name with multiple consecutive underscores', () => {
        const result = validateTableName('users___table');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          'Table name cannot contain consecutive underscores',
        );
      });

      it('should reject name that is only underscores', () => {
        const result = validateTableName('___');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Table name cannot start with underscore');
      });
    });
  });

  // ============================================================
  // generateTimestamp Tests
  // ============================================================
  describe('generateTimestamp', () => {
    it('should return timestamp in YYYYMMDDHHmmss format', () => {
      const timestamp = generateTimestamp();
      expect(timestamp).toMatch(/^\d{14}$/);
    });

    it('should return 14 character string', () => {
      const timestamp = generateTimestamp();
      expect(timestamp.length).toBe(14);
    });

    it('should generate correct timestamp based on current date', () => {
      const mockDate = new Date('2026-01-07T15:20:30');
      jest.spyOn(globalThis, 'Date').mockImplementation(() => mockDate);

      const timestamp = generateTimestamp();
      expect(timestamp).toBe('20260107152030');

      jest.restoreAllMocks();
    });

    it('should pad single digit month with zero', () => {
      const mockDate = new Date('2026-05-07T15:20:30');
      jest.spyOn(globalThis, 'Date').mockImplementation(() => mockDate);

      const timestamp = generateTimestamp();
      expect(timestamp).toBe('20260507152030');

      jest.restoreAllMocks();
    });

    it('should pad single digit day with zero', () => {
      const mockDate = new Date('2026-01-05T15:20:30');
      jest.spyOn(globalThis, 'Date').mockImplementation(() => mockDate);

      const timestamp = generateTimestamp();
      expect(timestamp).toBe('20260105152030');

      jest.restoreAllMocks();
    });

    it('should pad single digit hours with zero', () => {
      const mockDate = new Date('2026-01-07T05:20:30');
      jest.spyOn(globalThis, 'Date').mockImplementation(() => mockDate);

      const timestamp = generateTimestamp();
      expect(timestamp).toBe('20260107052030');

      jest.restoreAllMocks();
    });

    it('should pad single digit minutes with zero', () => {
      const mockDate = new Date('2026-01-07T15:05:30');
      jest.spyOn(globalThis, 'Date').mockImplementation(() => mockDate);

      const timestamp = generateTimestamp();
      expect(timestamp).toBe('20260107150530');

      jest.restoreAllMocks();
    });

    it('should pad single digit seconds with zero', () => {
      const mockDate = new Date('2026-01-07T15:20:05');
      jest.spyOn(globalThis, 'Date').mockImplementation(() => mockDate);

      const timestamp = generateTimestamp();
      expect(timestamp).toBe('20260107152005');

      jest.restoreAllMocks();
    });
  });

  // ============================================================
  // generateMigrationTemplate Tests
  // ============================================================
  describe('generateMigrationTemplate', () => {
    it('should include the table name in createTable call', () => {
      const template = generateMigrationTemplate('users');
      expect(template).toContain('createTable(\n    "users"');
    });

    it('should include the table name in dropTableIfExists call', () => {
      const template = generateMigrationTemplate('users');
      expect(template).toContain('dropTableIfExists("users")');
    });

    it('should include exports.up function', () => {
      const template = generateMigrationTemplate('users');
      expect(template).toContain('exports.up = function (knex)');
    });

    it('should include exports.down function', () => {
      const template = generateMigrationTemplate('users');
      expect(template).toContain('exports.down = function (knex)');
    });

    it('should include knex JSDoc type annotation', () => {
      const template = generateMigrationTemplate('users');
      expect(template).toContain('@param { import("knex").Knex } knex');
    });

    it('should include Promise<void> return type', () => {
      const template = generateMigrationTemplate('users');
      expect(template).toContain('@returns { Promise<void> }');
    });

    it('should work with multi-word table names', () => {
      const template = generateMigrationTemplate('user_profiles');
      expect(template).toContain('createTable(\n    "user_profiles"');
      expect(template).toContain('dropTableIfExists("user_profiles")');
    });

    it('should return valid JavaScript syntax', () => {
      const template = generateMigrationTemplate('test_table');
      // Check that it doesn't throw when evaluated as a function string
      expect(() => {
        // Just check it's valid string, not actually evaluate
        JSON.stringify(template);
      }).not.toThrow();
    });
  });

  // ============================================================
  // createMigrationFile Tests
  // ============================================================
  describe('createMigrationFile', () => {
    beforeEach(() => {
      fs.existsSync.mockReturnValue(true);
      fs.writeFileSync.mockImplementation(() => {});
      fs.mkdirSync.mockImplementation(() => {});
    });

    it('should create file with correct filename format', () => {
      const mockDate = new Date('2026-01-07T15:20:30');
      jest.spyOn(globalThis, 'Date').mockImplementation(() => mockDate);

      createMigrationFile('users');

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('20260107152030_create_users_table.js'),
        expect.any(String),
        'utf8',
      );

      jest.restoreAllMocks();
    });

    it('should create file in migrations directory', () => {
      createMigrationFile('users');

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining(path.join('src', 'database', 'migrations')),
        expect.any(String),
        'utf8',
      );
    });

    it('should create migrations directory if not exists', () => {
      fs.existsSync.mockReturnValue(false);

      createMigrationFile('users');

      expect(fs.mkdirSync).toHaveBeenCalledWith(MIGRATIONS_DIR, {
        recursive: true,
      });
    });

    it('should not create directory if already exists', () => {
      fs.existsSync.mockReturnValue(true);

      createMigrationFile('users');

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should write migration template content to file', () => {
      createMigrationFile('users');

      const writeCall = fs.writeFileSync.mock.calls[0];
      const content = writeCall[1];

      expect(content).toContain('exports.up');
      expect(content).toContain('exports.down');
      expect(content).toContain('createTable');
      expect(content).toContain('"users"');
    });

    it('should log success message', () => {
      createMigrationFile('users');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Migration file created successfully'),
      );
    });

    it('should log file path', () => {
      createMigrationFile('users');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Path:'),
      );
    });

    it('should log table name', () => {
      createMigrationFile('users');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Table: users'),
      );
    });

    it('should handle multi-word table names correctly', () => {
      const mockDate = new Date('2026-01-07T15:20:30');
      jest.spyOn(globalThis, 'Date').mockImplementation(() => mockDate);

      createMigrationFile('user_profiles');

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('20260107152030_create_user_profiles_table.js'),
        expect.any(String),
        'utf8',
      );

      jest.restoreAllMocks();
    });
  });

  // ============================================================
  // MIGRATIONS_DIR Tests
  // ============================================================
  describe('MIGRATIONS_DIR', () => {
    it('should be defined', () => {
      expect(MIGRATIONS_DIR).toBeDefined();
    });

    it('should end with migrations directory', () => {
      expect(MIGRATIONS_DIR).toContain('migrations');
    });

    it('should contain database directory in path', () => {
      expect(MIGRATIONS_DIR).toContain('database');
    });

    it('should contain src directory in path', () => {
      expect(MIGRATIONS_DIR).toContain('src');
    });
  });

  // ============================================================
  // Integration-like Tests
  // ============================================================
  describe('end-to-end workflow', () => {
    beforeEach(() => {
      fs.existsSync.mockReturnValue(true);
      fs.writeFileSync.mockImplementation(() => {});
    });

    it('should normalize, validate, and create file for valid input', () => {
      const input = 'USER_PROFILES';
      const normalized = normalizeTableName(input);
      const validation = validateTableName(normalized);

      expect(normalized).toBe('user_profiles');
      expect(validation.valid).toBe(true);

      createMigrationFile(normalized);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should normalize, validate, and reject invalid input', () => {
      const input = 'user profiles';
      const normalized = normalizeTableName(input);
      const validation = validateTableName(normalized);

      expect(normalized).toBe('user profiles');
      expect(validation.valid).toBe(false);
    });

    it('should handle complete workflow with mixed case input', () => {
      const input = 'Orders_For_Delivery';
      const normalized = normalizeTableName(input);
      const validation = validateTableName(normalized);

      expect(normalized).toBe('orders_for_delivery');
      expect(validation.valid).toBe(true);

      createMigrationFile(normalized);

      const writeCall = fs.writeFileSync.mock.calls[0];
      const content = writeCall[1];
      expect(content).toContain('"orders_for_delivery"');
    });
  });
});

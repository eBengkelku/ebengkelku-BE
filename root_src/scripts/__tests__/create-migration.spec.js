/**
 * Comprehensive unit tests for create-migration.js with schema support
 *
 * Tests cover:
 * - loadEnvConfig: Load and validate database configuration from environment
 * - normalizeSchemaName: Converts schema name input to lowercase
 * - normalizeTableName: Converts table name input to lowercase
 * - validateSchemaName: Validates schema name format
 * - validateTableName: Validates table name format
 * - generateTimestamp: Generates timestamp in YYYYMMDDHHmmss format
 * - generateMigrationTemplate: Generates migration file content with schema
 * - generateNewSchemaMigrationTemplate: Generates migration content for new schemas
 * - createMigrationFile: Creates migration file in the migrations directory
 * - fetchSchemas: Fetches available schemas from database
 * - createDbConnection: Creates PostgreSQL client connection
 */

const path = require('node:path');

// Mock fs module with proper Jest mock functions
jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

// Mock pg module
jest.mock('pg', () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue({ rows: [] }),
    end: jest.fn().mockResolvedValue(undefined),
  })),
}));

const fs = require('node:fs');
const { Client } = require('pg');

const {
  loadEnvConfig,
  createDbConnection,
  fetchSchemas,
  normalizeSchemaName,
  normalizeTableName,
  validateSchemaName,
  validateTableName,
  generateTimestamp,
  generateMigrationTemplate,
  generateNewSchemaMigrationTemplate,
  createMigrationFile,
  MIGRATIONS_DIR,
  SYSTEM_SCHEMAS,
} = require('../create-migration');

describe('create-migration with schema support', () => {
  // Store original environment
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Reset environment for each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  // ============================================================
  // SYSTEM_SCHEMAS Tests
  // ============================================================
  describe('SYSTEM_SCHEMAS', () => {
    it('should be defined', () => {
      expect(SYSTEM_SCHEMAS).toBeDefined();
    });

    it('should be an array', () => {
      expect(Array.isArray(SYSTEM_SCHEMAS)).toBe(true);
    });

    it('should include pg_catalog', () => {
      expect(SYSTEM_SCHEMAS).toContain('pg_catalog');
    });

    it('should include information_schema', () => {
      expect(SYSTEM_SCHEMAS).toContain('information_schema');
    });

    it('should include pg_toast', () => {
      expect(SYSTEM_SCHEMAS).toContain('pg_toast');
    });

    it('should have at least 4 system schemas', () => {
      expect(SYSTEM_SCHEMAS.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ============================================================
  // loadEnvConfig Tests
  // ============================================================
  describe('loadEnvConfig', () => {
    beforeEach(() => {
      // Set up valid environment
      process.env.DEV_DB_HOST = 'localhost';
      process.env.DEV_DB_PORT = '5432';
      process.env.DEV_DB_USER = 'test_user';
      process.env.DEV_DB_PASSWORD = 'test_pass';
      process.env.DEV_DB_NAME = 'test_db';
      process.env.DEV_DB_SSL = 'false';
    });

    it('should return config object with all properties', () => {
      const config = loadEnvConfig();
      expect(config).toHaveProperty('host');
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('user');
      expect(config).toHaveProperty('password');
      expect(config).toHaveProperty('database');
      expect(config).toHaveProperty('ssl');
    });

    it('should read host from DEV_DB_HOST', () => {
      process.env.DEV_DB_HOST = 'myhost.example.com';
      const config = loadEnvConfig();
      expect(config.host).toBe('myhost.example.com');
    });

    it('should read port from DEV_DB_PORT', () => {
      process.env.DEV_DB_PORT = '6432';
      const config = loadEnvConfig();
      expect(config.port).toBe(6432);
    });

    it('should default port to 5432', () => {
      delete process.env.DEV_DB_PORT;
      const config = loadEnvConfig();
      expect(config.port).toBe(5432);
    });

    it('should read user from DEV_DB_USER', () => {
      process.env.DEV_DB_USER = 'admin_user';
      const config = loadEnvConfig();
      expect(config.user).toBe('admin_user');
    });

    it('should read password from DEV_DB_PASSWORD', () => {
      process.env.DEV_DB_PASSWORD = 'secret123';
      const config = loadEnvConfig();
      expect(config.password).toBe('secret123');
    });

    it('should read database from DEV_DB_NAME', () => {
      process.env.DEV_DB_NAME = 'production_db';
      const config = loadEnvConfig();
      expect(config.database).toBe('production_db');
    });

    it('should set ssl to true when DEV_DB_SSL is true', () => {
      process.env.DEV_DB_SSL = 'true';
      const config = loadEnvConfig();
      expect(config.ssl).toBe(true);
    });

    it('should set ssl to false when DEV_DB_SSL is false', () => {
      process.env.DEV_DB_SSL = 'false';
      const config = loadEnvConfig();
      expect(config.ssl).toBe(false);
    });

    it('should throw error when DEV_DB_HOST is missing', () => {
      delete process.env.DEV_DB_HOST;
      expect(() => loadEnvConfig()).toThrow(/DEV_DB_HOST/);
    });

    it('should throw error when DEV_DB_USER is missing', () => {
      delete process.env.DEV_DB_USER;
      expect(() => loadEnvConfig()).toThrow(/DEV_DB_USER/);
    });

    it('should throw error when DEV_DB_PASSWORD is missing', () => {
      delete process.env.DEV_DB_PASSWORD;
      expect(() => loadEnvConfig()).toThrow(/DEV_DB_PASSWORD/);
    });

    it('should throw error when DEV_DB_NAME is missing', () => {
      delete process.env.DEV_DB_NAME;
      expect(() => loadEnvConfig()).toThrow(/DEV_DB_NAME/);
    });

    it('should include all missing fields in error message', () => {
      delete process.env.DEV_DB_HOST;
      delete process.env.DEV_DB_USER;
      expect(() => loadEnvConfig()).toThrow(/DEV_DB_HOST.*DEV_DB_USER/);
    });
  });

  // ============================================================
  // createDbConnection Tests
  // ============================================================
  describe('createDbConnection', () => {
    const mockConfig = {
      host: 'localhost',
      port: 5432,
      user: 'test_user',
      password: 'test_pass',
      database: 'test_db',
      ssl: false,
    };

    it('should create a PostgreSQL client', async () => {
      await createDbConnection(mockConfig);
      expect(Client).toHaveBeenCalled();
    });

    it('should connect to the database', async () => {
      const client = await createDbConnection(mockConfig);
      expect(client.connect).toHaveBeenCalled();
    });

    it('should pass correct connection parameters', async () => {
      await createDbConnection(mockConfig);
      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'localhost',
          port: 5432,
          user: 'test_user',
          password: 'test_pass',
          database: 'test_db',
        }),
      );
    });

    it('should handle SSL false correctly', async () => {
      await createDbConnection({ ...mockConfig, ssl: false });
      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          ssl: false,
        }),
      );
    });

    it('should handle SSL true correctly', async () => {
      await createDbConnection({ ...mockConfig, ssl: true });
      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          ssl: expect.objectContaining({
            rejectUnauthorized: false,
          }),
        }),
      );
    });

    it('should return connected client', async () => {
      const client = await createDbConnection(mockConfig);
      expect(client).toBeDefined();
      expect(client.query).toBeDefined();
    });
  });

  // ============================================================
  // fetchSchemas Tests
  // ============================================================
  describe('fetchSchemas', () => {
    it('should return array of schema names', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [
            { schema_name: 'public' },
            { schema_name: 'inventory' },
            { schema_name: 'sales' },
          ],
        }),
      };

      const schemas = await fetchSchemas(mockClient);
      expect(schemas).toEqual(['public', 'inventory', 'sales']);
    });

    it('should return empty array when no schemas', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
      };

      const schemas = await fetchSchemas(mockClient);
      expect(schemas).toEqual([]);
    });

    it('should execute query on client', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
      };

      await fetchSchemas(mockClient);
      expect(mockClient.query).toHaveBeenCalled();
    });

    it('should query information_schema.schemata', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
      };

      await fetchSchemas(mockClient);
      const queryCall = mockClient.query.mock.calls[0][0];
      expect(queryCall).toContain('information_schema.schemata');
    });

    it('should exclude system schemas in query', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
      };

      await fetchSchemas(mockClient);
      const queryCall = mockClient.query.mock.calls[0][0];
      expect(queryCall).toContain('pg_catalog');
      expect(queryCall).toContain('information_schema');
    });

    it('should handle single schema result', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [{ schema_name: 'public' }],
        }),
      };

      const schemas = await fetchSchemas(mockClient);
      expect(schemas).toEqual(['public']);
    });
  });

  // ============================================================
  // normalizeSchemaName Tests
  // ============================================================
  describe('normalizeSchemaName', () => {
    describe('when input is uppercase', () => {
      it('should convert to lowercase', () => {
        expect(normalizeSchemaName('INVENTORY')).toBe('inventory');
      });
    });

    describe('when input is mixed case', () => {
      it('should convert to lowercase', () => {
        expect(normalizeSchemaName('SaLeS_DaTa')).toBe('sales_data');
      });
    });

    describe('when input is already lowercase', () => {
      it('should return unchanged', () => {
        expect(normalizeSchemaName('public')).toBe('public');
      });
    });

    describe('when input contains underscores', () => {
      it('should preserve underscores', () => {
        expect(normalizeSchemaName('USER_DATA')).toBe('user_data');
      });
    });

    describe('when input is capitalized', () => {
      it('should convert to lowercase', () => {
        expect(normalizeSchemaName('Inventory')).toBe('inventory');
      });
    });

    describe('when input has multiple words with underscores', () => {
      it('should handle multi-word names', () => {
        expect(normalizeSchemaName('Sales_Reports_Archive')).toBe(
          'sales_reports_archive',
        );
      });
    });
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
  // validateSchemaName Tests
  // ============================================================
  describe('validateSchemaName', () => {
    describe('valid schema names', () => {
      it('should accept simple lowercase name', () => {
        const result = validateSchemaName('public');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept name with single underscore', () => {
        const result = validateSchemaName('user_data');
        expect(result.valid).toBe(true);
      });

      it('should accept name with multiple underscores', () => {
        const result = validateSchemaName('sales_reports_archive');
        expect(result.valid).toBe(true);
      });

      it('should accept single character name', () => {
        const result = validateSchemaName('a');
        expect(result.valid).toBe(true);
      });

      it('should accept long name', () => {
        const result = validateSchemaName(
          'very_long_schema_name_with_many_words',
        );
        expect(result.valid).toBe(true);
      });
    });

    describe('empty input', () => {
      it('should reject empty string', () => {
        const result = validateSchemaName('');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Schema name cannot be empty');
      });

      it('should reject null', () => {
        const result = validateSchemaName(null);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Schema name cannot be empty');
      });

      it('should reject undefined', () => {
        const result = validateSchemaName(undefined);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Schema name cannot be empty');
      });
    });

    describe('invalid characters', () => {
      it('should reject name with spaces', () => {
        const result = validateSchemaName('user data');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          'Schema name can only contain lowercase letters (a-z) and underscores (_)',
        );
      });

      it('should reject name with hyphen', () => {
        const result = validateSchemaName('user-data');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          'Schema name can only contain lowercase letters (a-z) and underscores (_)',
        );
      });

      it('should reject name with numbers', () => {
        const result = validateSchemaName('schema123');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          'Schema name can only contain lowercase letters (a-z) and underscores (_)',
        );
      });

      it('should reject name with special characters', () => {
        const result = validateSchemaName('schema@data');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          'Schema name can only contain lowercase letters (a-z) and underscores (_)',
        );
      });

      it('should reject name with uppercase letters', () => {
        const result = validateSchemaName('Schema');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          'Schema name can only contain lowercase letters (a-z) and underscores (_)',
        );
      });

      it('should reject name with dots', () => {
        const result = validateSchemaName('schema.data');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          'Schema name can only contain lowercase letters (a-z) and underscores (_)',
        );
      });
    });

    describe('underscore position', () => {
      it('should reject name starting with underscore', () => {
        const result = validateSchemaName('_inventory');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Schema name cannot start with underscore');
      });

      it('should reject name ending with underscore', () => {
        const result = validateSchemaName('inventory_');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Schema name cannot end with underscore');
      });

      it('should reject name with consecutive underscores', () => {
        const result = validateSchemaName('sales__data');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          'Schema name cannot contain consecutive underscores',
        );
      });

      it('should reject name with multiple consecutive underscores', () => {
        const result = validateSchemaName('sales___data');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          'Schema name cannot contain consecutive underscores',
        );
      });

      it('should reject name that is only underscores', () => {
        const result = validateSchemaName('___');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Schema name cannot start with underscore');
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
    it('should include withSchema method', () => {
      const template = generateMigrationTemplate('inventory', 'products');
      expect(template).toContain('.withSchema("inventory")');
    });

    it('should include the schema name in withSchema call', () => {
      const template = generateMigrationTemplate('sales', 'orders');
      expect(template).toContain('.withSchema("sales")');
    });

    it('should include the table name in createTable call', () => {
      const template = generateMigrationTemplate('inventory', 'products');
      expect(template).toContain('.createTable("products"');
    });

    it('should include the table name in dropTableIfExists call', () => {
      const template = generateMigrationTemplate('inventory', 'products');
      expect(template).toContain('.dropTableIfExists("products")');
    });

    it('should include exports.up function', () => {
      const template = generateMigrationTemplate('public', 'users');
      expect(template).toContain('exports.up = function (knex)');
    });

    it('should include exports.down function', () => {
      const template = generateMigrationTemplate('public', 'users');
      expect(template).toContain('exports.down = function (knex)');
    });

    it('should include knex JSDoc type annotation', () => {
      const template = generateMigrationTemplate('public', 'users');
      expect(template).toContain('@param { import("knex").Knex } knex');
    });

    it('should include Promise<void> return type', () => {
      const template = generateMigrationTemplate('public', 'users');
      expect(template).toContain('@returns { Promise<void> }');
    });

    it('should work with multi-word schema names', () => {
      const template = generateMigrationTemplate('user_data', 'profiles');
      expect(template).toContain('.withSchema("user_data")');
    });

    it('should work with multi-word table names', () => {
      const template = generateMigrationTemplate('public', 'user_profiles');
      expect(template).toContain('.createTable("user_profiles"');
      expect(template).toContain('.dropTableIfExists("user_profiles")');
    });

    it('should have correct method chaining structure', () => {
      const template = generateMigrationTemplate('inventory', 'products');
      expect(template).toContain('knex.schema');
      expect(template).toContain('.withSchema("inventory")');
      expect(template).toContain('.createTable("products"');
    });

    it('should return valid JavaScript syntax', () => {
      const template = generateMigrationTemplate('test_schema', 'test_table');
      expect(() => {
        JSON.stringify(template);
      }).not.toThrow();
    });
  });

  // ============================================================
  // generateNewSchemaMigrationTemplate Tests
  // ============================================================
  describe('generateNewSchemaMigrationTemplate', () => {
    it('should include createSchemaIfNotExists', () => {
      const template = generateNewSchemaMigrationTemplate(
        'new_inventory',
        'products',
      );
      expect(template).toContain(
        'knex.schema.createSchemaIfNotExists("new_inventory")',
      );
    });

    it('should use async function for exports.up', () => {
      const template = generateNewSchemaMigrationTemplate(
        'new_schema',
        'items',
      );
      expect(template).toContain('exports.up = async function (knex)');
    });

    it('should include await for createSchemaIfNotExists', () => {
      const template = generateNewSchemaMigrationTemplate(
        'new_schema',
        'items',
      );
      expect(template).toContain(
        'await knex.schema.createSchemaIfNotExists("new_schema")',
      );
    });

    it('should include withSchema for createTable', () => {
      const template = generateNewSchemaMigrationTemplate(
        'new_inventory',
        'products',
      );
      expect(template).toContain('.withSchema("new_inventory")');
      expect(template).toContain('.createTable("products"');
    });

    it('should include withSchema for dropTableIfExists', () => {
      const template = generateNewSchemaMigrationTemplate(
        'new_inventory',
        'products',
      );
      expect(template).toContain('.withSchema("new_inventory")');
      expect(template).toContain('.dropTableIfExists("products")');
    });

    it('should include exports.down function', () => {
      const template = generateNewSchemaMigrationTemplate(
        'new_schema',
        'items',
      );
      expect(template).toContain('exports.down = function (knex)');
    });

    it('should not use async for exports.down', () => {
      const template = generateNewSchemaMigrationTemplate(
        'new_schema',
        'items',
      );
      expect(template).not.toContain('exports.down = async function');
    });

    it('should include JSDoc annotations', () => {
      const template = generateNewSchemaMigrationTemplate(
        'new_schema',
        'items',
      );
      expect(template).toContain('@param { import("knex").Knex } knex');
      expect(template).toContain('@returns { Promise<void> }');
    });

    it('should include comment about creating schema', () => {
      const template = generateNewSchemaMigrationTemplate(
        'new_schema',
        'items',
      );
      expect(template).toContain("Create schema if it doesn't exist");
    });

    it('should include comment about creating table', () => {
      const template = generateNewSchemaMigrationTemplate(
        'new_schema',
        'items',
      );
      expect(template).toContain('Create table in the new schema');
    });

    it('should work with multi-word schema names', () => {
      const template = generateNewSchemaMigrationTemplate(
        'new_user_data',
        'profiles',
      );
      expect(template).toContain('createSchemaIfNotExists("new_user_data")');
      expect(template).toContain('.withSchema("new_user_data")');
    });

    it('should return valid JavaScript syntax', () => {
      const template = generateNewSchemaMigrationTemplate(
        'new_schema',
        'test_table',
      );
      expect(() => {
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

    it('should create file with correct filename format including schema', () => {
      const mockDate = new Date('2026-01-07T15:20:30');
      jest.spyOn(globalThis, 'Date').mockImplementation(() => mockDate);

      createMigrationFile('inventory', 'products', false);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining(
          '20260107152030_create_inventory_products_table.js',
        ),
        expect.any(String),
        'utf8',
      );

      jest.restoreAllMocks();
    });

    it('should create file in migrations directory', () => {
      createMigrationFile('public', 'users', false);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining(path.join('src', 'database', 'migrations')),
        expect.any(String),
        'utf8',
      );
    });

    it('should create migrations directory if not exists', () => {
      fs.existsSync.mockReturnValue(false);

      createMigrationFile('inventory', 'products', false);

      expect(fs.mkdirSync).toHaveBeenCalledWith(MIGRATIONS_DIR, {
        recursive: true,
      });
    });

    it('should not create directory if already exists', () => {
      fs.existsSync.mockReturnValue(true);

      createMigrationFile('public', 'users', false);

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should write migration template content with schema', () => {
      createMigrationFile('inventory', 'products', false);

      const writeCall = fs.writeFileSync.mock.calls[0];
      const content = writeCall[1];

      expect(content).toContain('exports.up');
      expect(content).toContain('exports.down');
      expect(content).toContain('.withSchema("inventory")');
      expect(content).toContain('"products"');
    });

    it('should use new schema template when isNewSchema is true', () => {
      createMigrationFile('new_inventory', 'products', true);

      const writeCall = fs.writeFileSync.mock.calls[0];
      const content = writeCall[1];

      expect(content).toContain('createSchemaIfNotExists');
      expect(content).toContain('async function');
    });

    it('should use existing schema template when isNewSchema is false', () => {
      createMigrationFile('public', 'users', false);

      const writeCall = fs.writeFileSync.mock.calls[0];
      const content = writeCall[1];

      expect(content).not.toContain('createSchemaIfNotExists');
      expect(content).not.toContain('async function');
    });

    it('should log success message', () => {
      createMigrationFile('public', 'users', false);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Migration file created successfully'),
      );
    });

    it('should log file path', () => {
      createMigrationFile('public', 'users', false);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Path:'),
      );
    });

    it('should log schema name', () => {
      createMigrationFile('inventory', 'products', false);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Schema: inventory'),
      );
    });

    it('should log table name', () => {
      createMigrationFile('inventory', 'products', false);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Table: products'),
      );
    });

    it('should log new schema message when creating new schema', () => {
      createMigrationFile('new_inventory', 'products', true);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('New schema will be created'),
      );
    });

    it('should not log new schema message for existing schema', () => {
      createMigrationFile('public', 'users', false);

      const logCalls = console.log.mock.calls;
      const newSchemaMessages = logCalls.filter((call) =>
        call[0].includes('New schema will be created'),
      );
      expect(newSchemaMessages.length).toBe(0);
    });

    it('should handle multi-word schema and table names correctly', () => {
      const mockDate = new Date('2026-01-07T15:20:30');
      jest.spyOn(globalThis, 'Date').mockImplementation(() => mockDate);

      createMigrationFile('user_data', 'user_profiles', false);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining(
          '20260107152030_create_user_data_user_profiles_table.js',
        ),
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

    it('should normalize, validate, and create file for valid schema and table input', () => {
      const schemaInput = 'INVENTORY_DATA';
      const tableInput = 'USER_PROFILES';

      const normalizedSchema = normalizeSchemaName(schemaInput);
      const normalizedTable = normalizeTableName(tableInput);
      const schemaValidation = validateSchemaName(normalizedSchema);
      const tableValidation = validateTableName(normalizedTable);

      expect(normalizedSchema).toBe('inventory_data');
      expect(normalizedTable).toBe('user_profiles');
      expect(schemaValidation.valid).toBe(true);
      expect(tableValidation.valid).toBe(true);

      createMigrationFile(normalizedSchema, normalizedTable, false);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should normalize, validate, and reject invalid schema input', () => {
      const schemaInput = 'invalid schema';
      const normalizedSchema = normalizeSchemaName(schemaInput);
      const schemaValidation = validateSchemaName(normalizedSchema);

      expect(normalizedSchema).toBe('invalid schema');
      expect(schemaValidation.valid).toBe(false);
    });

    it('should normalize, validate, and reject invalid table input', () => {
      const tableInput = 'user profiles';
      const normalizedTable = normalizeTableName(tableInput);
      const tableValidation = validateTableName(normalizedTable);

      expect(normalizedTable).toBe('user profiles');
      expect(tableValidation.valid).toBe(false);
    });

    it('should handle complete workflow with mixed case input', () => {
      const schemaInput = 'Sales_Reports';
      const tableInput = 'Orders_For_Delivery';

      const normalizedSchema = normalizeSchemaName(schemaInput);
      const normalizedTable = normalizeTableName(tableInput);
      const schemaValidation = validateSchemaName(normalizedSchema);
      const tableValidation = validateTableName(normalizedTable);

      expect(normalizedSchema).toBe('sales_reports');
      expect(normalizedTable).toBe('orders_for_delivery');
      expect(schemaValidation.valid).toBe(true);
      expect(tableValidation.valid).toBe(true);

      createMigrationFile(normalizedSchema, normalizedTable, false);

      const writeCall = fs.writeFileSync.mock.calls[0];
      const content = writeCall[1];
      expect(content).toContain('.withSchema("sales_reports")');
      expect(content).toContain('"orders_for_delivery"');
    });

    it('should handle new schema workflow correctly', () => {
      const schemaInput = 'NEW_INVENTORY';
      const tableInput = 'Products';

      const normalizedSchema = normalizeSchemaName(schemaInput);
      const normalizedTable = normalizeTableName(tableInput);
      const schemaValidation = validateSchemaName(normalizedSchema);
      const tableValidation = validateTableName(normalizedTable);

      expect(schemaValidation.valid).toBe(true);
      expect(tableValidation.valid).toBe(true);

      createMigrationFile(normalizedSchema, normalizedTable, true);

      const writeCall = fs.writeFileSync.mock.calls[0];
      const content = writeCall[1];
      expect(content).toContain('createSchemaIfNotExists("new_inventory")');
      expect(content).toContain('.withSchema("new_inventory")');
      expect(content).toContain('"products"');
    });

    it('should generate correct file name with schema and table', () => {
      const mockDate = new Date('2026-01-12T20:15:30');
      jest.spyOn(globalThis, 'Date').mockImplementation(() => mockDate);

      createMigrationFile('inventory', 'products', false);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining(
          '20260112201530_create_inventory_products_table.js',
        ),
        expect.any(String),
        'utf8',
      );

      jest.restoreAllMocks();
    });
  });

  // ============================================================
  // Template Content Validation Tests
  // ============================================================
  describe('template content validation', () => {
    it('should generate valid exports.up and exports.down structure', () => {
      const template = generateMigrationTemplate('public', 'users');

      // Check structure
      expect(template).toMatch(/exports\.up\s*=\s*function/);
      expect(template).toMatch(/exports\.down\s*=\s*function/);
    });

    it('should have proper return statements', () => {
      const template = generateMigrationTemplate('public', 'users');

      // Both functions should return knex.schema...
      expect(template).toContain('return knex.schema');
    });

    it('should have balanced function braces', () => {
      const template = generateMigrationTemplate('inventory', 'products');
      const openBraces = (template.match(/{/g) || []).length;
      const closeBraces = (template.match(/}/g) || []).length;

      expect(openBraces).toBe(closeBraces);
    });

    it('should have proper JSDoc for both functions', () => {
      const template = generateMigrationTemplate('inventory', 'products');
      const jsdocCount = (
        template.match(/@param\s*{\s*import\("knex"\)\.Knex\s*}\s*knex/g) || []
      ).length;

      expect(jsdocCount).toBe(2); // One for each function
    });

    it('should generate new schema template with correct async structure', () => {
      const template = generateNewSchemaMigrationTemplate(
        'new_schema',
        'items',
      );

      // exports.up should be async
      expect(template).toMatch(/exports\.up\s*=\s*async\s+function/);
      // exports.down should not be async
      expect(template).not.toMatch(/exports\.down\s*=\s*async\s+function/);
    });

    it('should have await before createSchemaIfNotExists', () => {
      const template = generateNewSchemaMigrationTemplate(
        'new_schema',
        'items',
      );

      expect(template).toMatch(/await\s+knex\.schema\.createSchemaIfNotExists/);
    });
  });
});

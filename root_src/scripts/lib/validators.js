/**
 * Validation utilities for migration generator
 */

function normalizeSchemaName(name) {
  return name.toLowerCase();
}

function normalizeTableName(name) {
  return name.toLowerCase();
}

function validateName(name, type) {
  if (!name || name.length === 0) {
    return { valid: false, error: `${type} name cannot be empty` };
  }
  if (!/^[a-z_]+$/.test(name)) {
    return {
      valid: false,
      error: `${type} name can only contain lowercase letters (a-z) and underscores (_)`,
    };
  }
  if (name.startsWith('_')) {
    return { valid: false, error: `${type} name cannot start with underscore` };
  }
  if (name.endsWith('_')) {
    return { valid: false, error: `${type} name cannot end with underscore` };
  }
  if (name.includes('__')) {
    return {
      valid: false,
      error: `${type} name cannot contain consecutive underscores`,
    };
  }
  return { valid: true };
}

function validateSchemaName(name) {
  return validateName(name, 'Schema');
}

function validateTableName(name) {
  return validateName(name, 'Table');
}

module.exports = {
  normalizeSchemaName,
  normalizeTableName,
  validateSchemaName,
  validateTableName,
};

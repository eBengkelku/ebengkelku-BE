require('dotenv').config();

// Import environment-specific database configurations
const localConfig = require('./src/config/local/database.ts').default;
const developmentConfig =
  require('./src/config/development/database.ts').default;
const productionConfig = require('./src/config/production/database.ts').default;

module.exports = {
  local: localConfig(),
  development: developmentConfig(),
  production: productionConfig(),
};

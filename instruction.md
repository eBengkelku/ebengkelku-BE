<context>
Currently, we already have a script `pnpm run db:migrate:create:table` and it is working well. However, there has been a change in requirements. Previously, the script was run for a database that did not use a schema, so it would always use the ‘public’ schema. Meanwhile, the latest requirement after a meeting with the developers and DB Engineers is that they want the database to be schema-based. So, there may be schemas A, B, C, etc., not just the ‘public’ schema.

Currently, when the script is run, it will immediately prompt the user to enter the desired table name. We have to change that. So, when the script is run, we will first display a list of schemas in the database being used. This means we have to connect to the database. We can get the details from the `.env` file, which I will provide below.

When it is first run, it will look something like this

Knex Migration File Generator

Choose the schema you want to use

> Schema 1
> Schema 2
> Schema 3
> Create new schema

If the user selects an existing schema, they will proceed directly to entering the table name. However, if the user chooses to create a new schema, they must enter the schema name. Whatever the user enters, whether it's lowercase, uppercase, capitalised, or mixed, it will all be converted to lowercase. The table name can contain more than one word, but they must be separated by an underscore. For example, `users_for_whatsapp` is allowed. However, `user for whatsapp` is not allowed. Only then will the user be taken to the next step to enter the table name.

Then, the contents of the template file will change. Please correct me if I'm wrong. This is the template content I want.

```js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable(
    "nama_schema_yang _tadi_diinput"."table_name_yang_tadi_diinput",
    function (table) {}
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("nama_schema_yang _tadi_diinput"."table_name_yang_tadi_diinput");
};
```

This is the value of the `.env` file

```env
# ============================================================================
# ENVIRONMENT CONFIGURATION TEMPLATE
# ============================================================================
# Copy this file to .env and fill in values for your environment

NODE_ENV=development
CI=true

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
DEV_DB_HOST=108.171.193.183                        # Database server IP/hostname
DEV_DB_PORT=6432                                 # Default PostgreSQL port
DEV_DB_USER=ebengkelku_dev                         # Database username
DEV_DB_PASSWORD=nuv7du                # Database password
DEV_DB_NAME=ebengkelku_dev                         # Database name
DEV_DB_SSL=false                                 # Set to 'true' if SSL required
# DEV_DB_SSL_REJECT_UNAUTHORIZED=false           # Uncomment for self-signed certs

# ============================================================================
# REDIS CONFIGURATION
# ============================================================================
DEV_REDIS_HOST=redis                         # Redis server hostname
DEV_REDIS_PORT=6379                              # Default Redis port
DEV_REDIS_PASSWORD=admin123                     # Redis password
DEV_REDIS_TLS=false                              # Set to 'true' if TLS required

# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================
PORT=3004                                        # Application port

# Service Authentication (API-to-API communication)
APP_SERVICE_ID=your-service-id                   # Service identifier
APP_SERVICE_SECRET=your-service-secret           # Service secret key

# ============================================================================
# OPTIONAL: DEBUG & LOGGING
# ============================================================================
LOG_LEVEL=info                                   # Options: debug, info, warn, error
LOG_FORMAT=pretty                                # Options: pretty, json
DB_DEBUG=true                                   # Enable SQL query logging

# ============================================================================
# AUTHENTICATION CONFIGURATION
# ============================================================================
# AUTH_MODE: 'local' or 'keycloak'
# - local: Use local JWKS file (config/jwks/jwks.json) for token verification
# - keycloak: Use remote Keycloak SSO (requires ISSUER and AUDIENCE)
AUTH_MODE=local

# Required only when AUTH_MODE=keycloak:
# ISSUER=https://your-keycloak-server/realms/your-realm
# AUDIENCE=your-client-id
```

</context>

<role>
You are a senior backend engineer responsible for all of the code in this project. You have access to the entire codebase for this project and you know this project inside and out. You understand the data flow and how responses and requests are processed in this project. Because you are the thorough person, you will always analyze the codebase before you start the action.
</role>

<action>
Considering the existing context, create the best technical solution to overcome this problem or do your work, including:
1. Create new branch from current branch. The new branch name should follow the convention that being used in this project. After that, working on that branch. The convention is `feat/`, `hotfix/`, `chore/`, `scripts/`, etc.
2. Create a plan by looking at the bigger picture, from incoming requests to outgoing responses.
3. When create the technical plan, outline the function (method) signature, data types, flow data, and step-by-step logic without code implementation. This is means you need create the technical plan very detail into the smallest detail. I want you to create a diagram to show the flow of data and the flow of logic.
4. Ensure that the code is sustainable, maintainable, reusable, and modular.
5. Ensure that the code follows the SOLID, DRY, KISS, and YAGNI principles.
6. Think in terms of the system to ensure and identify the interrelationships between files and the possibility of break changes that may occur.
7. Analyze the codebase to understand the architecture and data flow of this project.
8. If possible, always use left join instead of inner join.
</action>

<context>
I want to create a utility that will construct a JWT (access_token) for this project. It's okay if we use dependencies or third parties that can construct JWT for us. However, when the JWT is decoded, it must be exactly the same as below.

For example, our token looks like this.

```
eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJmSTdwNTNFZmo1NXJBWk1FMGd5RERFSHFEOHh0c09yNU56X2lFaWZFWUZZIn0.eyJleHAiOjE3Njk0OTc4NDUsImlhdCI6MTc2OTQ5NzU0NSwiYXV0aF90aW1lIjoxNzY5NDk3NTM2LCJqdGkiOiJvbnJ0YWM6MjMwYjM4ZjYtOWRjYi04MWYxLTlmNmUtYzI4NDk2YTQxYWI5IiwiaXNzIjoiaHR0cHM6Ly9hdXRoLnVwbnZqLmFjLmlkL3JlYWxtcy9teWFwcC10ZXN0IiwiYXVkIjoiYWNjb3VudCIsInN1YiI6ImZmMWExZDQ0LThkZjAtNGI2Yi1iMDg5LWE5MTJkNGJjMDIyMCIsInR5cCI6IkJlYXJlciIsImF6cCI6Im15LWRhc2hib2FyZCIsInNpZCI6IjM0ZDM2MDhkLWJhYTgtNGUxMC1hZTlmLWFlOTFlMjczNDljZiIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cHM6Ly9teWRhc2hib2FyZC51cG52ai5hYy5pZCIsImh0dHA6Ly9teS51cG52ai5sb2NhbCIsImh0dHA6Ly9teS51cG52ai5sb2NhbDozMDAwIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIiwiZGVmYXVsdC1yb2xlcy1teWFwcC10ZXN0Il19LCJyZXNvdXJjZV9hY2Nlc3MiOnsibXktZGFzaGJvYXJkIjp7InJvbGVzIjpbInN0YWZmIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGF1ZC1teS1hdXRoLWZyb250ZW5kIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoiQmlhcyBSaXpraSBOdWdyb2hvIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiMjMxMDUwMTAxM0BtYWhhc2lzd2EudXBudmouYWMuaWQiLCJnaXZlbl9uYW1lIjoiQmlhcyIsImVtYWlsIjoiMjMxMDUwMTAxM0BtYWhhc2lzd2EudXBudmouYWMuaWQifQ.hhOk5fCFWsG20G1TwmgFlTbgRUT8ACQrnFztAbyjHw5day-yX53_qf9cYoULNCDjjygE-NEyQTy_L-PvZGneCWWcI_rtTDsp46kEgy5lT3ssyxPSTrr0-lKd-jRgw129s1OPB76bsk6TdUC2l1VPIz7qYPeOhlX_oXy-i65OeZyLaff4XV9XxVAQJSGNxrbOBwd-inWLfhIqg2tqOmkOWy8dqAkN0fyStwmxkKRQUMMYmVq0uKX06H8-nVF3Pa8aFh3qLYgLqdjocUCD9ZKoBNQ4NQ8F1w5AyeekJk6Iu88C60Pb6JqYGNjDmU2Av7pGg-UBjbkooW7FApFiUsZyhQ
```

Then the decoded result will be like this.

```json
{
  "exp" (Expiration time (seconds since Unix epoch)): 1769497845, --> Tue Jan 27 2026 14:10:45 GMT+0700 (Western Indonesia Time), ini nanti bisa kita atur berapa lamanya.
  "iat" (Issued at (seconds since Unix epoch)): 1769497545, --> Tue Jan 27 2026 14:05:45 GMT+0700 (Western Indonesia Time)
  "auth_time" (Time when authentication occurred): 1769497536, --> Tue Jan 27 2026 14:05:36 GMT+0700 (Western Indonesia Time)
  "jti" (JWT ID (unique identifier for this token)): "onrtac:230b38f6-9dcb-81f1-9f6e-c28496a41ab9",
  "sub" (Subject): "ff1a1d44-8df0-4b6b-b089-a912d4bc0220", --> user ID di table core.users
  "typ" (Type): "Bearer",
  "roles": "role_id di table core.user_roles", --> harus cek user ID (sub) dulu
  "permissions": [
    "key_permission_1",
    "key_permission_2",
    "key_permission_3",
    "dst"
  ], --> key_permission ini diambil dari table core.permissions. Tapi, kita cek dulu permission_id di table core.role_permissions dengan mencocokan role ID nya dengan value dari key `roles` di atas.
  "name": "Bias Rizki Nugroho",
  "email": "2310501013@mahasiswa.upnvj.ac.id"
}
```

This is the related tables

```sql
-- core.permissions definition

-- Drop table

-- DROP TABLE core.permissions;

CREATE TABLE core.permissions (
	"key" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	id_creator uuid NULL,
	id_updater uuid NULL,
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	CONSTRAINT permissions_key_unique UNIQUE (key),
	CONSTRAINT permissions_pkey PRIMARY KEY (id),
	CONSTRAINT permissions_id_creator_foreign FOREIGN KEY (id_creator) REFERENCES core.users(public_id),
	CONSTRAINT permissions_id_updater_foreign FOREIGN KEY (id_updater) REFERENCES core.users(public_id)
);
CREATE INDEX permissions_key_index ON core.permissions USING btree (key);

-- core.role_permissions definition

-- Drop table

-- DROP TABLE core.role_permissions;

CREATE TABLE core.role_permissions (
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	id_creator uuid NULL,
	id_updater uuid NULL,
	role_id uuid NOT NULL,
	permission_id uuid NOT NULL,
	CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id),
	CONSTRAINT role_permissions_id_creator_foreign FOREIGN KEY (id_creator) REFERENCES core.users(public_id),
	CONSTRAINT role_permissions_id_updater_foreign FOREIGN KEY (id_updater) REFERENCES core.users(public_id),
	CONSTRAINT role_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES core.permissions(id) ON DELETE CASCADE,
	CONSTRAINT role_permissions_role_id_foreign FOREIGN KEY (role_id) REFERENCES core.roles(id) ON DELETE CASCADE
);
CREATE INDEX role_permissions_permission_id_index ON core.role_permissions USING btree (permission_id);
CREATE INDEX role_permissions_role_id_index ON core.role_permissions USING btree (role_id);

-- core.roles definition

-- Drop table

-- DROP TABLE core.roles;

CREATE TABLE core.roles (
	"key" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	id_creator uuid NULL,
	id_updater uuid NULL,
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	CONSTRAINT roles_key_unique UNIQUE (key),
	CONSTRAINT roles_pkey PRIMARY KEY (id),
	CONSTRAINT roles_id_creator_foreign FOREIGN KEY (id_creator) REFERENCES core.users(public_id),
	CONSTRAINT roles_id_updater_foreign FOREIGN KEY (id_updater) REFERENCES core.users(public_id)
);
CREATE INDEX roles_key_index ON core.roles USING btree (key);

-- core.user_roles definition

-- Drop table

-- DROP TABLE core.user_roles;

CREATE TABLE core.user_roles (
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	id_creator uuid NULL,
	id_updater uuid NULL,
	user_id uuid NOT NULL,
	role_id uuid NOT NULL,
	CONSTRAINT user_roles_id_creator_foreign FOREIGN KEY (id_creator) REFERENCES core.users(public_id),
	CONSTRAINT user_roles_id_updater_foreign FOREIGN KEY (id_updater) REFERENCES core.users(public_id),
	CONSTRAINT user_roles_role_id_foreign FOREIGN KEY (role_id) REFERENCES core.roles(id) ON DELETE CASCADE,
	CONSTRAINT user_roles_user_id_foreign FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE
);
CREATE INDEX user_roles_role_id_index ON core.user_roles USING btree (role_id);
CREATE INDEX user_roles_user_id_index ON core.user_roles USING btree (user_id);

-- core.users definition

-- Drop table

-- DROP TABLE core.users;

CREATE TABLE core.users (
	public_id uuid DEFAULT uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	email text NULL,
	phone text NULL,
	"password" varchar(255) NULL,
	image varchar(500) NULL,
	provider text NULL,
	provider_id text NULL,
	email_verified_at timestamptz NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	id_creator uuid NULL,
	id_updater uuid NULL,
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	is_encrypted bool DEFAULT false NOT NULL,
	CONSTRAINT users_email_unique UNIQUE (email),
	CONSTRAINT users_pkey PRIMARY KEY (id),
	CONSTRAINT users_public_id_unique UNIQUE (public_id),
	CONSTRAINT users_id_creator_foreign FOREIGN KEY (id_creator) REFERENCES core.users(public_id),
	CONSTRAINT users_id_updater_foreign FOREIGN KEY (id_updater) REFERENCES core.users(public_id)
);
CREATE INDEX idx_users_is_encrypted ON core.users USING btree (is_encrypted);
CREATE INDEX users_email_index ON core.users USING btree (email);
CREATE INDEX users_phone_index ON core.users USING btree (phone);
CREATE INDEX users_public_id_index ON core.users USING btree (public_id);
```

We will create it in root_src/src/libs/jwt. Inside that folder, there will be interfaces, errors, and services folders. Then, we will place the controller and module at the outermost level. I want the settings for the expiration time to be placed in .env (you can put it in .env.example) with the prefix `JWT_EXPIRED_TIME`. The value will be a number representing milliseconds.

We will also create at least 30 test cases for success tests, 30 test cases for failed tests, 30 test cases for edge cases, and 30 test cases for security cases. These are all for unit tests. My boss asked for the tests to be broken down into smaller pieces so that they can be easily modified if there are changes in the future.

This is the value of .env file, so you do not need to open the file.

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
DB_DEBUG=false                                   # Enable SQL query logging

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

# ============================================================================
# USER DATA ENCRYPTION (PDP Compliance)
# ============================================================================
# Passphrase for decrypting the RSA private key (REQUIRED)
ENCRYPTION_KEY_PASSPHRASE=Tesduluajadeh123!

# Key file paths (optional, defaults to config directory)
# ENCRYPTION_PUBLIC_KEY_PATH=./src/config/encryption-keys/public-key.json
# ENCRYPTION_PRIVATE_KEY_PATH=./src/config/encryption-keys/private-key.json

# Batch processing configuration (optional)
# ENCRYPTION_BATCH_SIZE=100                      # Records per batch
# ENCRYPTION_BATCH_DELAY_MS=100                  # Delay between batches (ms)
# ENCRYPTION_DRY_RUN=false                       # Set 'true' to test without saving
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
4. Ensure that the code is sustainable, maintainable, secure, reusable, testable, and modular.
5. Ensure that the code follows the SOLID, DRY, KISS, and YAGNI principles.
6. Think in terms of the system to ensure and identify the interrelationships between files and the possibility of break changes that may occur.
7. Analyze the codebase to understand the architecture and data flow of this project.
8. If possible, always use left join instead of inner join.
</action>

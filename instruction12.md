<context>
We will create an API `/v1/register/owner`. This endpoint will be used to register workshop owners (merchants). The logic is the same as the `/v1/register/user` endpoint; all the logic will be exactly the same. The only difference is that they will automatically be assigned the owner role.

We will create it in root_src/src/domains/auth/register/owner/. Within that domain, there must be folders for DTO, interfaces, errors, models, and repository. So, the controller will call the service, the service will call the repository, and the repository will call the models. Implement the i18n. You can see how the other domains (product domain is the referenced) are structured.

Then, create unit tests that can cover at least 30 positive cases and at least 30 negative cases. Also create edge case scenarios.

This is the table you'll use.

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

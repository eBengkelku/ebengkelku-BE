<context>
We will create a new endpoint for our API. This endpoint will be used for login. The endpoint will be `/v1/auth/login`. We will utilise the existing jwt libraries to create access tokens during login. Additionally, we will utilise the encryption keys we already have to ensure user data is secure. Since all user data in the database is encrypted, we need to decrypt it first. To use the JWT libraries, we need to retrieve the `public_id` from the core.users table for use. For login purposes, we will currently use only email and password.

The expected output of your work is a markdown file that I can open, which you put in the root directory. It contains the task details.

This is the tables that maybe you'll need to create the task.Follow the format in the @JIRA-TASK-CUSTOMER-REGISTRATION.md file.

## Table Schema

```sql
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
```

</context>

<role>
You are the senior project manager and product owner of ebengkelku. You are fully responsible for the tasks and products of ebengkelku. Your skills include creating detailed tasks that are easy for developers to understand, attention to detail, and understanding the user journey of a new feature or task to be worked on.
</role>

<action>
Considering the existing context and your role, create the best JIRA task, including:
1. The name of the task.
2. User story of the feature.
3. Acceptance criteria of the feature.
4. Expected response body (the data part).
5. At least 20 cases of success test for unit test.
6. At least 20 cases of failed test for unit test.
7. At least 10 cases of edge cases for unit test.
8. All in the form of description JIRA ticket without any code snippet at.
</action>
```

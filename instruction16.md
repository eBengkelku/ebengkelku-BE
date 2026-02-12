<context>
We will create a new endpoint. This endpoint will use POST. The main purpose of this endpoint is to create new data layanan (service) for a workshop. You can determine the details of the endpoint, such as the request body and response body. For the header, we will just use x-lang for now.

We will create it in new domain. Within that domain, there must be folders for DTO, interfaces, errors, models, and repository. So, the controller will call the service, the service will call the repository, and the repository will call the models. Implement the i18n. You can see how the other domains (product domain is the referenced) are structured.

Then, create unit tests that can cover at least 30 positive cases and at least 30 negative cases. Also create edge case scenarios.

This is the table you'll use.

```sql
-- service.services definition

-- Drop table

-- DROP TABLE service.services;

CREATE TABLE service.services (
	"name" varchar(255) NOT NULL,
	description text NULL,
	price int4 NOT NULL,
	duration_minutes int4 NULL,
	daily_quota int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	id_creator uuid NULL,
	id_updater uuid NULL,
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	business_id uuid NOT NULL,
	CONSTRAINT services_pkey PRIMARY KEY (id),
	CONSTRAINT services_business_id_foreign FOREIGN KEY (business_id) REFERENCES business.businesses(id) ON DELETE CASCADE,
	CONSTRAINT services_id_creator_foreign FOREIGN KEY (id_creator) REFERENCES core.users(public_id),
	CONSTRAINT services_id_updater_foreign FOREIGN KEY (id_updater) REFERENCES core.users(public_id)
);
CREATE INDEX services_business_id_index ON service.services USING btree (business_id);

-- business.businesses definition

-- Drop table

-- DROP TABLE business.businesses;

CREATE TABLE business.businesses (
	"name" varchar(255) NOT NULL,
	tagline varchar(500) NULL,
	status text DEFAULT 'pending'::text NULL,
	phone varchar(50) NULL,
	image varchar(500) NULL,
	cover_image varchar(500) NULL,
	latitude numeric(11, 8) NULL,
	longitude numeric(11, 8) NULL,
	address text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	id_creator uuid NULL,
	id_updater uuid NULL,
	owner_id uuid NOT NULL,
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	CONSTRAINT businesses_pkey PRIMARY KEY (id),
	CONSTRAINT businesses_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'banned'::text]))),
	CONSTRAINT businesses_id_creator_foreign FOREIGN KEY (id_creator) REFERENCES core.users(public_id),
	CONSTRAINT businesses_id_updater_foreign FOREIGN KEY (id_updater) REFERENCES core.users(public_id),
	CONSTRAINT businesses_owner_id_foreign FOREIGN KEY (owner_id) REFERENCES core.users(id) ON DELETE CASCADE
);
CREATE INDEX businesses_owner_id_index ON business.businesses USING btree (owner_id);
CREATE INDEX businesses_status_index ON business.businesses USING btree (status);
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
5. At least 30 cases of success test for unit test.
6. At least 30 cases of failed test for unit test.
7. At least 30 cases of edge cases for unit test.
8. All in the form of description JIRA ticket without any code snippet at.
</action>
```

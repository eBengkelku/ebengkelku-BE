<context>
We will create a new endpoint. This endpoint will use POST. The main purpose of this endpoint is to create new data from a workshop. You can determine the details of the endpoint, such as the request body and response body. For the header, we will just use x-lang for now.

We will create it in new domain. Within that domain, there must be folders for DTO, interfaces, errors, models, and repository. So, the controller will call the service, the service will call the repository, and the repository will call the models. Implement the i18n. You can see how the other domains (product domain is the referenced) are structured.

Then, create unit tests that can cover at least 30 positive cases and at least 30 negative cases. Also create edge case scenarios.

This is the table you'll use.

```sql
-- business.businesses definition

-- Drop table

-- DROP TABLE business.businesses;

CREATE TABLE business.businesses (
name varchar(255) NOT NULL,
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

-- business.business_hours definition

-- Drop table

-- DROP TABLE business.business_hours;

CREATE TABLE business.business_hours (
day_of_week int4 NOT NULL,
open_time time NULL,
close_time time NULL,
updated_at timestamptz NULL,
deleted_at timestamptz NULL,
id_creator uuid NULL,
id_updater uuid NULL,
id uuid DEFAULT uuid_generate_v4() NOT NULL,
business_id uuid NOT NULL,
CONSTRAINT business_hours_pkey PRIMARY KEY (id),
CONSTRAINT business_hours_business_id_foreign FOREIGN KEY (business_id) REFERENCES business.businesses(id) ON DELETE CASCADE,
CONSTRAINT business_hours_id_creator_foreign FOREIGN KEY (id_creator) REFERENCES core.users(public_id),
CONSTRAINT business_hours_id_updater_foreign FOREIGN KEY (id_updater) REFERENCES core.users(public_id)
);
CREATE INDEX business_hours_business_id_index ON business.business_hours USING btree (business_id);
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

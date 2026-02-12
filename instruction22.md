<context>
Saat ini di endpoint `POST /v1/products/{businessId}` ketika berhasil create suatu product responsenya akan seperti di bawah ini

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Product created successfully",
  "data": null,
  "errors": null,
  "timestamp": "2026-02-12T12:07:46.810Z",
  "path": "/v1/products/f953db2b-ceb6-44c9-bc1e-6fdeb6dfd715",
  "requestTime": 2198
}
```

Tidak ada data yang jelas mengenai product yang baru saja dibuat, maka dari itu saya ingin menambahkan data product yang baru saja dibuat ke dalam response. Yang aku mau itu di dalam key "data" ada JSON tentang product yang baru saja dibuat, seperti nama, deskripsi, harga, unit, status, category_id, business_id, id, dan lain-lain. Kamu bisa mencontohnya di domain services, terutama endpoint `POST /v1/services` ketika berhasil membuat data sebuah service (layanan).

Aku juga yakin hal yang sama terjadi di endpoint `PUT /v1/products/{businessId}`, `POST /v1/tool-products/{businessId}/{productId}`, `PUT /v1/tool-products/{businessId}/{productId}`, `POST /v1/spare-part-products/{businessId}/{productId}`, `PUT /v1/spare-part-products/{businessId}/{productId}`, `POST /v1/inventories/{businessId}/{productId}`, `PUT /v1/inventories/{businessId}/{productId}`.

Jadi, saya ingin menambahkan data product yang baru saja dibuat ke dalam response di semua endpoint tersebut. Kamu bisa mencontohnya di domain services, terutama endpoint `POST /v1/services` ketika berhasil membuat data sebuah service (layanan).

Berikut schema DB nya

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
	last_login timestamptz NULL,
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

-- product.products definition

-- Drop table

-- DROP TABLE product.products;

CREATE TABLE product.products (
	"name" varchar(255) NOT NULL,
	description text NULL,
	price int4 NOT NULL,
	unit varchar(50) DEFAULT 'pcs'::character varying NULL,
	status text DEFAULT 'draft'::text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	id_creator uuid NULL,
	id_updater uuid NULL,
	category_id uuid NOT NULL,
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	business_id uuid NOT NULL,
	CONSTRAINT products_pkey PRIMARY KEY (id),
	CONSTRAINT products_status_check CHECK (((status = ANY (ARRAY['active'::text, 'draft'::text, 'archived'::text]))))
);

-- product.inventories definition

-- Drop table

-- DROP TABLE product.inventories;

CREATE TABLE product.inventories (
	quantity int4 DEFAULT 0 NULL,
	min_stock int4 DEFAULT 0 NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	id_creator uuid NULL,
	id_updater uuid NULL,
	product_id uuid NOT NULL,
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	CONSTRAINT inventories_pkey PRIMARY KEY (id),
	CONSTRAINT inventories_id_creator_foreign FOREIGN KEY (id_creator) REFERENCES core.users(public_id),
	CONSTRAINT inventories_id_updater_foreign FOREIGN KEY (id_updater) REFERENCES core.users(public_id),
	CONSTRAINT inventories_product_id_foreign FOREIGN KEY (product_id) REFERENCES product.products(id) ON DELETE CASCADE
);
CREATE INDEX inventories_product_id_index ON product.inventories USING btree (product_id);

-- product.product_categories definition

-- Drop table

-- DROP TABLE product.product_categories;

CREATE TABLE product.product_categories (
	"name" varchar(255) NOT NULL,
	description text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	id_creator uuid NULL,
	id_updater uuid NULL,
	product_type_id uuid NOT NULL,
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	CONSTRAINT product_categories_pkey PRIMARY KEY (id),
	CONSTRAINT product_categories_id_creator_foreign FOREIGN KEY (id_creator) REFERENCES core.users(public_id),
	CONSTRAINT product_categories_id_updater_foreign FOREIGN KEY (id_updater) REFERENCES core.users(public_id),
	CONSTRAINT product_categories_product_type_id_foreign FOREIGN KEY (product_type_id) REFERENCES product.product_types(id) ON DELETE CASCADE
);
CREATE INDEX product_categories_product_type_id_index ON product.product_categories USING btree (product_type_id);

-- product.tool_products definition

-- Drop table

-- DROP TABLE product.tool_products;

CREATE TABLE product.tool_products (
	warranty_months int4 DEFAULT 0 NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	id_creator uuid NULL,
	id_updater uuid NULL,
	product_id uuid NOT NULL,
	CONSTRAINT tool_products_pkey PRIMARY KEY (product_id),
	CONSTRAINT tool_products_id_creator_foreign FOREIGN KEY (id_creator) REFERENCES core.users(public_id),
	CONSTRAINT tool_products_id_updater_foreign FOREIGN KEY (id_updater) REFERENCES core.users(public_id),
	CONSTRAINT tool_products_product_id_foreign FOREIGN KEY (product_id) REFERENCES product.products(id) ON DELETE CASCADE
);

-- product.product_types definition

-- Drop table

-- DROP TABLE product.product_types;

CREATE TABLE product.product_types (
	"name" varchar(100) NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	id_creator uuid NULL,
	id_updater uuid NULL,
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	CONSTRAINT product_types_name_unique UNIQUE (name),
	CONSTRAINT product_types_pkey PRIMARY KEY (id),
	CONSTRAINT product_types_id_creator_foreign FOREIGN KEY (id_creator) REFERENCES core.users(public_id),
	CONSTRAINT product_types_id_updater_foreign FOREIGN KEY (id_updater) REFERENCES core.users(public_id)
);
CREATE INDEX product_types_name_index ON product.product_types USING btree (name);

-- product.spare_part_products definition

-- Drop table

-- DROP TABLE product.spare_part_products;

CREATE TABLE product.spare_part_products (
	brand varchar(255) NULL,
	grade text NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	id_creator uuid NULL,
	id_updater uuid NULL,
	product_id uuid NOT NULL,
	CONSTRAINT spare_part_products_grade_check CHECK ((grade = ANY (ARRAY['genuine'::text, 'aftermarket'::text]))),
	CONSTRAINT spare_part_products_pkey PRIMARY KEY (product_id),
	CONSTRAINT spare_part_products_id_creator_foreign FOREIGN KEY (id_creator) REFERENCES core.users(public_id),
	CONSTRAINT spare_part_products_id_updater_foreign FOREIGN KEY (id_updater) REFERENCES core.users(public_id),
	CONSTRAINT spare_part_products_product_id_foreign FOREIGN KEY (product_id) REFERENCES product.products(id) ON DELETE CASCADE
);

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

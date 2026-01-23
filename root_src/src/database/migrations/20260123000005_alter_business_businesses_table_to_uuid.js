/**
 * Alter business.businesses table to use UUID primary key
 * This handles ALL foreign key dependencies for business.businesses
 *
 * Dependencies (tables that reference business.businesses.id):
 * - business.business_hours (business_id)
 * - business.business_reviews (business_id)
 * - hr.employments (business_id)
 * - product.products (business_id)
 * - sales.sales (business_id)
 * - service.services (business_id)
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Drop ALL foreign key constraints referencing business.businesses.id
  // 1. business.business_hours
  await knex.schema
    .withSchema('business')
    .alterTable('business_hours', function (table) {
      table.dropForeign(['business_id']);
    });

  // 2. business.business_reviews
  await knex.schema
    .withSchema('business')
    .alterTable('business_reviews', function (table) {
      table.dropForeign(['business_id']);
    });

  // 3. hr.employments
  await knex.schema
    .withSchema('hr')
    .alterTable('employments', function (table) {
      table.dropForeign(['business_id']);
    });

  // 4. product.products
  await knex.schema
    .withSchema('product')
    .alterTable('products', function (table) {
      table.dropForeign(['business_id']);
    });

  // 5. sales.sales
  await knex.schema.withSchema('sales').alterTable('sales', function (table) {
    table.dropForeign(['business_id']);
  });

  // 6. service.services
  await knex.schema
    .withSchema('service')
    .alterTable('services', function (table) {
      table.dropForeign(['business_id']);
    });

  // Drop and recreate id column as UUID
  await knex.schema
    .withSchema('business')
    .alterTable('businesses', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('business')
    .alterTable('businesses', function (table) {
      table
        .uuid('id')
        .primary()
        .defaultTo(knex.raw('uuid_generate_v4()'))
        .notNullable()
        .first();
    });

  // Recreate ALL foreign key columns and constraints with UUID type
  // 1. business.business_hours
  await knex.schema
    .withSchema('business')
    .alterTable('business_hours', function (table) {
      table.dropColumn('business_id');
    });
  await knex.schema
    .withSchema('business')
    .alterTable('business_hours', function (table) {
      table
        .uuid('business_id')
        .notNullable()
        .references('id')
        .inTable('business.businesses')
        .onDelete('CASCADE');
      table.index(['business_id']);
    });

  // 2. business.business_reviews
  await knex.schema
    .withSchema('business')
    .alterTable('business_reviews', function (table) {
      table.dropColumn('business_id');
    });
  await knex.schema
    .withSchema('business')
    .alterTable('business_reviews', function (table) {
      table
        .uuid('business_id')
        .notNullable()
        .references('id')
        .inTable('business.businesses')
        .onDelete('CASCADE');
      table.index(['business_id']);
    });

  // 3. hr.employments
  await knex.schema
    .withSchema('hr')
    .alterTable('employments', function (table) {
      table.dropColumn('business_id');
    });
  await knex.schema
    .withSchema('hr')
    .alterTable('employments', function (table) {
      table
        .uuid('business_id')
        .notNullable()
        .references('id')
        .inTable('business.businesses')
        .onDelete('CASCADE');
      table.index(['business_id']);
    });

  // 4. product.products
  await knex.schema
    .withSchema('product')
    .alterTable('products', function (table) {
      table.dropColumn('business_id');
    });
  await knex.schema
    .withSchema('product')
    .alterTable('products', function (table) {
      table
        .uuid('business_id')
        .notNullable()
        .references('id')
        .inTable('business.businesses')
        .onDelete('CASCADE');
      table.index(['business_id']);
    });

  // 5. sales.sales
  await knex.schema.withSchema('sales').alterTable('sales', function (table) {
    table.dropColumn('business_id');
  });
  await knex.schema.withSchema('sales').alterTable('sales', function (table) {
    table
      .uuid('business_id')
      .notNullable()
      .references('id')
      .inTable('business.businesses')
      .onDelete('CASCADE');
    table.index(['business_id']);
  });

  // 6. service.services
  await knex.schema
    .withSchema('service')
    .alterTable('services', function (table) {
      table.dropColumn('business_id');
    });
  await knex.schema
    .withSchema('service')
    .alterTable('services', function (table) {
      table
        .uuid('business_id')
        .notNullable()
        .references('id')
        .inTable('business.businesses')
        .onDelete('CASCADE');
      table.index(['business_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Drop all FK constraints and columns
  const tables = [
    { schema: 'business', table: 'business_hours', column: 'business_id' },
    { schema: 'business', table: 'business_reviews', column: 'business_id' },
    { schema: 'hr', table: 'employments', column: 'business_id' },
    { schema: 'product', table: 'products', column: 'business_id' },
    { schema: 'sales', table: 'sales', column: 'business_id' },
    { schema: 'service', table: 'services', column: 'business_id' },
  ];

  for (const { schema, table, column } of tables) {
    await knex.schema.withSchema(schema).alterTable(table, function (t) {
      t.dropForeign([column]);
      t.dropColumn(column);
    });
  }

  // Revert to integer
  await knex.schema
    .withSchema('business')
    .alterTable('businesses', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('business')
    .alterTable('businesses', function (table) {
      table.increments('id').primary().first();
    });

  // Recreate all FKs with integer type
  for (const { schema, table, column } of tables) {
    await knex.schema.withSchema(schema).alterTable(table, function (t) {
      t.integer(column)
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('business.businesses')
        .onDelete('CASCADE');
      t.index([column]);
    });
  }
};

/**
 * Alter core.users table to use UUID primary key
 * Converts integer id to UUID with proper extension setup
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Drop ALL foreign key constraints referencing core.users.id
  // 1. core.user_roles
  await knex.schema
    .withSchema('core')
    .alterTable('user_roles', function (table) {
      table.dropForeign(['user_id']);
    });

  // 2. business.business_reviews
  await knex.schema
    .withSchema('business')
    .alterTable('business_reviews', function (table) {
      table.dropForeign(['user_id']);
    });

  // 3. hr.employments
  await knex.schema
    .withSchema('hr')
    .alterTable('employments', function (table) {
      table.dropForeign(['user_id']);
    });

  // 4. sales.sales
  await knex.schema.withSchema('sales').alterTable('sales', function (table) {
    table.dropForeign(['customer_id']);
  });

  // 5. vehicle.customer_garage
  await knex.schema
    .withSchema('vehicle')
    .alterTable('customer_garage', function (table) {
      table.dropForeign(['customer_id']);
    });

  // 6. service.service_bookings
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table.dropForeign(['customer_id']);
    });

  // 7. business.businesses (owner_id)
  await knex.schema
    .withSchema('business')
    .alterTable('businesses', function (table) {
      table.dropForeign(['owner_id']);
    });

  // Now drop and recreate the id column as UUID
  await knex.schema.withSchema('core').alterTable('users', function (table) {
    table.dropColumn('id');
  });

  await knex.schema.withSchema('core').alterTable('users', function (table) {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('uuid_generate_v4()'))
      .notNullable()
      .first();
  });

  // Recreate all foreign key columns and constraints with UUID type
  // 1. core.user_roles
  await knex.schema
    .withSchema('core')
    .alterTable('user_roles', function (table) {
      table.dropColumn('user_id');
    });
  await knex.schema
    .withSchema('core')
    .alterTable('user_roles', function (table) {
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('core.users')
        .onDelete('CASCADE');
      table.index(['user_id']);
    });

  // 2. business.business_reviews
  await knex.schema
    .withSchema('business')
    .alterTable('business_reviews', function (table) {
      table.dropColumn('user_id');
    });
  await knex.schema
    .withSchema('business')
    .alterTable('business_reviews', function (table) {
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('core.users')
        .onDelete('CASCADE');
      table.index(['user_id']);
    });

  // 3. hr.employments
  await knex.schema
    .withSchema('hr')
    .alterTable('employments', function (table) {
      table.dropColumn('user_id');
    });
  await knex.schema
    .withSchema('hr')
    .alterTable('employments', function (table) {
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('core.users')
        .onDelete('CASCADE');
      table.index(['user_id']);
    });

  // 4. sales.sales (customer_id)
  await knex.schema.withSchema('sales').alterTable('sales', function (table) {
    table.dropColumn('customer_id');
  });
  await knex.schema.withSchema('sales').alterTable('sales', function (table) {
    table
      .uuid('customer_id')
      .notNullable()
      .references('id')
      .inTable('core.users')
      .onDelete('CASCADE');
    table.index(['customer_id']);
  });

  // 5. vehicle.customer_garage (customer_id)
  await knex.schema
    .withSchema('vehicle')
    .alterTable('customer_garage', function (table) {
      table.dropColumn('customer_id');
    });
  await knex.schema
    .withSchema('vehicle')
    .alterTable('customer_garage', function (table) {
      table
        .uuid('customer_id')
        .notNullable()
        .references('id')
        .inTable('core.users')
        .onDelete('CASCADE');
      table.index(['customer_id']);
    });

  // 6. service.service_bookings (customer_id)
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table.dropColumn('customer_id');
    });
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table
        .uuid('customer_id')
        .notNullable()
        .references('id')
        .inTable('core.users')
        .onDelete('CASCADE');
      table.index(['customer_id']);
    });

  // 7. business.businesses (owner_id)
  await knex.schema
    .withSchema('business')
    .alterTable('businesses', function (table) {
      table.dropColumn('owner_id');
    });
  await knex.schema
    .withSchema('business')
    .alterTable('businesses', function (table) {
      table
        .uuid('owner_id')
        .notNullable()
        .references('id')
        .inTable('core.users')
        .onDelete('CASCADE');
      table.index(['owner_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Drop all foreign key constraints and columns
  // 1. core.user_roles
  await knex.schema
    .withSchema('core')
    .alterTable('user_roles', function (table) {
      table.dropForeign(['user_id']);
      table.dropColumn('user_id');
    });

  // 2. business.business_reviews
  await knex.schema
    .withSchema('business')
    .alterTable('business_reviews', function (table) {
      table.dropForeign(['user_id']);
      table.dropColumn('user_id');
    });

  // 3. hr.employments
  await knex.schema
    .withSchema('hr')
    .alterTable('employments', function (table) {
      table.dropForeign(['user_id']);
      table.dropColumn('user_id');
    });

  // 4. sales.sales
  await knex.schema.withSchema('sales').alterTable('sales', function (table) {
    table.dropForeign(['customer_id']);
    table.dropColumn('customer_id');
  });

  // 5. vehicle.customer_garage
  await knex.schema
    .withSchema('vehicle')
    .alterTable('customer_garage', function (table) {
      table.dropForeign(['customer_id']);
      table.dropColumn('customer_id');
    });

  // 6. service.service_bookings
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table.dropForeign(['customer_id']);
      table.dropColumn('customer_id');
    });

  // 7. business.businesses
  await knex.schema
    .withSchema('business')
    .alterTable('businesses', function (table) {
      table.dropForeign(['owner_id']);
      table.dropColumn('owner_id');
    });

  // Revert core.users id to integer
  await knex.schema.withSchema('core').alterTable('users', function (table) {
    table.dropColumn('id');
  });

  await knex.schema.withSchema('core').alterTable('users', function (table) {
    table.increments('id').primary().first();
  });

  // Recreate all foreign keys with integer type
  // 1. core.user_roles
  await knex.schema
    .withSchema('core')
    .alterTable('user_roles', function (table) {
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('core.users')
        .onDelete('CASCADE');
      table.index(['user_id']);
    });

  // 2. business.business_reviews
  await knex.schema
    .withSchema('business')
    .alterTable('business_reviews', function (table) {
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('core.users')
        .onDelete('CASCADE');
      table.index(['user_id']);
    });

  // 3. hr.employments
  await knex.schema
    .withSchema('hr')
    .alterTable('employments', function (table) {
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('core.users')
        .onDelete('CASCADE');
      table.index(['user_id']);
    });

  // 4. sales.sales
  await knex.schema.withSchema('sales').alterTable('sales', function (table) {
    table
      .integer('customer_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('core.users')
      .onDelete('CASCADE');
    table.index(['customer_id']);
  });

  // 5. vehicle.customer_garage
  await knex.schema
    .withSchema('vehicle')
    .alterTable('customer_garage', function (table) {
      table
        .integer('customer_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('core.users')
        .onDelete('CASCADE');
      table.index(['customer_id']);
    });

  // 6. service.service_bookings
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table
        .integer('customer_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('core.users')
        .onDelete('CASCADE');
      table.index(['customer_id']);
    });

  // 7. business.businesses
  await knex.schema
    .withSchema('business')
    .alterTable('businesses', function (table) {
      table
        .integer('owner_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('core.users')
        .onDelete('CASCADE');
      table.index(['owner_id']);
    });
};

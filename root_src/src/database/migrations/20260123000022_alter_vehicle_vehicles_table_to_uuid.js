/**
 * Alter vehicle.vehicles table to use UUID primary key
 * Dependencies: customer_garage, used_vehicle_products
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Drop all FKs
  await knex.schema
    .withSchema('vehicle')
    .alterTable('customer_garage', function (table) {
      table.dropForeign(['vehicle_id']);
    });
  await knex.schema
    .withSchema('vehicle')
    .alterTable('used_vehicle_products', function (table) {
      table.dropForeign(['vehicle_id']);
    });

  // Drop and recreate id as UUID
  await knex.schema
    .withSchema('vehicle')
    .alterTable('vehicles', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('vehicle')
    .alterTable('vehicles', function (table) {
      table
        .uuid('id')
        .primary()
        .defaultTo(knex.raw('uuid_generate_v4()'))
        .notNullable()
        .first();
    });

  // Recreate FK columns as UUID
  await knex.schema
    .withSchema('vehicle')
    .alterTable('customer_garage', function (table) {
      table.dropColumn('vehicle_id');
    });
  await knex.schema
    .withSchema('vehicle')
    .alterTable('customer_garage', function (table) {
      table
        .uuid('vehicle_id')
        .notNullable()
        .references('id')
        .inTable('vehicle.vehicles')
        .onDelete('CASCADE');
      table.index(['vehicle_id']);
    });

  await knex.schema
    .withSchema('vehicle')
    .alterTable('used_vehicle_products', function (table) {
      table.dropColumn('vehicle_id');
    });
  await knex.schema
    .withSchema('vehicle')
    .alterTable('used_vehicle_products', function (table) {
      table
        .uuid('vehicle_id')
        .notNullable()
        .references('id')
        .inTable('vehicle.vehicles')
        .onDelete('CASCADE');
      table.index(['vehicle_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Drop all FKs
  await knex.schema
    .withSchema('vehicle')
    .alterTable('customer_garage', function (table) {
      table.dropForeign(['vehicle_id']);
      table.dropColumn('vehicle_id');
    });
  await knex.schema
    .withSchema('vehicle')
    .alterTable('used_vehicle_products', function (table) {
      table.dropForeign(['vehicle_id']);
      table.dropColumn('vehicle_id');
    });

  // Revert to integer
  await knex.schema
    .withSchema('vehicle')
    .alterTable('vehicles', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('vehicle')
    .alterTable('vehicles', function (table) {
      table.increments('id').primary().first();
    });

  // Recreate FKs with integer
  await knex.schema
    .withSchema('vehicle')
    .alterTable('customer_garage', function (table) {
      table
        .integer('vehicle_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('vehicle.vehicles')
        .onDelete('CASCADE');
      table.index(['vehicle_id']);
    });

  await knex.schema
    .withSchema('vehicle')
    .alterTable('used_vehicle_products', function (table) {
      table
        .integer('vehicle_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('vehicle.vehicles')
        .onDelete('CASCADE');
      table.index(['vehicle_id']);
    });
};

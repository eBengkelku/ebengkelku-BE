/**
 * Alter service.services table to use UUID primary key
 * Dependencies: service_bookings (service_id)
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Drop FK from service_bookings
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table.dropForeign(['service_id']);
    });

  // Drop and recreate id as UUID
  await knex.schema
    .withSchema('service')
    .alterTable('services', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('service')
    .alterTable('services', function (table) {
      table
        .uuid('id')
        .primary()
        .defaultTo(knex.raw('uuid_generate_v4()'))
        .notNullable()
        .first();
    });

  // Recreate FK column as UUID
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table.dropColumn('service_id');
    });
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table
        .uuid('service_id')
        .notNullable()
        .references('id')
        .inTable('service.services')
        .onDelete('CASCADE');
      table.index(['service_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Drop FK
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table.dropForeign(['service_id']);
      table.dropColumn('service_id');
    });

  // Revert to integer
  await knex.schema
    .withSchema('service')
    .alterTable('services', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('service')
    .alterTable('services', function (table) {
      table.increments('id').primary().first();
    });

  // Recreate FK with integer
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table
        .integer('service_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('service.services')
        .onDelete('CASCADE');
      table.index(['service_id']);
    });
};

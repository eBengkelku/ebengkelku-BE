/**
 * Alter business.business_hours table to use UUID primary key
 * Converts integer id to UUID with proper extension setup
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema
    .withSchema('business')
    .alterTable('business_hours', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('business')
    .alterTable('business_hours', function (table) {
      table
        .uuid('id')
        .primary()
        .defaultTo(knex.raw('uuid_generate_v4()'))
        .notNullable()
        .first();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema
    .withSchema('business')
    .alterTable('business_hours', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('business')
    .alterTable('business_hours', function (table) {
      table.increments('id').primary().first();
    });
};

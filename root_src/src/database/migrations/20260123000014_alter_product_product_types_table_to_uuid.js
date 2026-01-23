/**
 * Alter product.product_types table to use UUID primary key
 * Dependencies: product_categories (product_type_id)
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Drop FK from product_categories
  await knex.schema
    .withSchema('product')
    .alterTable('product_categories', function (table) {
      table.dropForeign(['product_type_id']);
    });

  // Drop and recreate id as UUID
  await knex.schema
    .withSchema('product')
    .alterTable('product_types', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('product')
    .alterTable('product_types', function (table) {
      table
        .uuid('id')
        .primary()
        .defaultTo(knex.raw('uuid_generate_v4()'))
        .notNullable()
        .first();
    });

  // Recreate FK column as UUID
  await knex.schema
    .withSchema('product')
    .alterTable('product_categories', function (table) {
      table.dropColumn('product_type_id');
    });
  await knex.schema
    .withSchema('product')
    .alterTable('product_categories', function (table) {
      table
        .uuid('product_type_id')
        .notNullable()
        .references('id')
        .inTable('product.product_types')
        .onDelete('CASCADE');
      table.index(['product_type_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Drop FK
  await knex.schema
    .withSchema('product')
    .alterTable('product_categories', function (table) {
      table.dropForeign(['product_type_id']);
      table.dropColumn('product_type_id');
    });

  // Revert to integer
  await knex.schema
    .withSchema('product')
    .alterTable('product_types', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('product')
    .alterTable('product_types', function (table) {
      table.increments('id').primary().first();
    });

  // Recreate FK with integer
  await knex.schema
    .withSchema('product')
    .alterTable('product_categories', function (table) {
      table
        .integer('product_type_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('product.product_types')
        .onDelete('CASCADE');
      table.index(['product_type_id']);
    });
};

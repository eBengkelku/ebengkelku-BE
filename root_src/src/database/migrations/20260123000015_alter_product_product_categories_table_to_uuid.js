/**
 * Alter product.product_categories table to use UUID primary key
 * Dependencies: products (category_id)
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Drop FK from products
  await knex.schema
    .withSchema('product')
    .alterTable('products', function (table) {
      table.dropForeign(['category_id']);
    });

  // Drop and recreate id as UUID
  await knex.schema
    .withSchema('product')
    .alterTable('product_categories', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('product')
    .alterTable('product_categories', function (table) {
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
    .alterTable('products', function (table) {
      table.dropColumn('category_id');
    });
  await knex.schema
    .withSchema('product')
    .alterTable('products', function (table) {
      table
        .uuid('category_id')
        .notNullable()
        .references('id')
        .inTable('product.product_categories')
        .onDelete('CASCADE');
      table.index(['category_id']);
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
    .alterTable('products', function (table) {
      table.dropForeign(['category_id']);
      table.dropColumn('category_id');
    });

  // Revert to integer
  await knex.schema
    .withSchema('product')
    .alterTable('product_categories', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('product')
    .alterTable('product_categories', function (table) {
      table.increments('id').primary().first();
    });

  // Recreate FK with integer
  await knex.schema
    .withSchema('product')
    .alterTable('products', function (table) {
      table
        .integer('category_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('product.product_categories')
        .onDelete('CASCADE');
      table.index(['category_id']);
    });
};

/**
 * Update products table migration
 * Add category_id foreign key to reference categories table for Many-to-One relationship
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('products', function (table) {
    // Add category_id foreign key column as UUID
    table
      .uuid('category_id')
      .nullable()
      .comment('Foreign key to categories table');

    // Create foreign key constraint
    table
      .foreign('category_id')
      .references('id')
      .inTable('categories')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Add index for better query performance
    table.index(['category_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('products', function (table) {
    // Drop foreign key constraint first
    table.dropForeign(['category_id']);

    // Drop category_id column
    table.dropColumn('category_id');
  });
};

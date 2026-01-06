/**
 * Update products table migration
 * Add file_id foreign key to reference files table for product images
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('products', function (table) {
    // Add file_id foreign key column as UUID
    table
      .uuid('file_id')
      .nullable()
      .comment('Foreign key to files table for product image');

    // Create foreign key constraint
    table
      .foreign('file_id')
      .references('id')
      .inTable('files')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Add index for better query performance
    table.index(['file_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('products', function (table) {
    // Drop foreign key constraint first
    table.dropForeign(['file_id']);

    // Drop file_id column
    table.dropColumn('file_id');
  });
};

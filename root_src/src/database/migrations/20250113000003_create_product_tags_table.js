/**
 * Create product_tags pivot table migration
 * This table bridges Many-to-Many relationship between products and tags
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('product_tags', function (table) {
    table
      .uuid('product_id')
      .notNullable()
      .comment('Foreign key to products table');
    table
      .uuid('tag_id')
      .notNullable()
      .comment('Foreign key to tags table');

    // Composite primary key
    table.primary(['product_id', 'tag_id']);

    // Foreign key constraints
    table
      .foreign('product_id')
      .references('id')
      .inTable('products')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table
      .foreign('tag_id')
      .references('id')
      .inTable('tags')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Indexes for better query performance
    table.index(['product_id']);
    table.index(['tag_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('product_tags');
};

/**
 * Create categories table migration
 * This table stores product categories with Many-to-One relationship to products
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .then(() => {
      return knex.schema.createTable('categories', function (table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table
          .string('name', 255)
          .notNullable()
          .unique()
          .comment('Category name (unique)');
        table
          .string('slug', 255)
          .notNullable()
          .unique()
          .comment('URL-friendly slug (unique, lowercase, no spaces)');
        table
          .text('description')
          .nullable()
          .comment('Category description');
        table.timestamps(true, true);
        table
          .timestamp('deleted_at')
          .nullable()
          .comment('Soft delete timestamp');

        // Indexes for better query performance
        table.index(['name']);
        table.index(['slug']);
        table.index(['deleted_at']);
      });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('categories');
};

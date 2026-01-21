/**
 * Create tags table migration
 * This table stores tags for product labeling with Many-to-Many relationship to products
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .then(() => {
      return knex.schema.createTable('tags', function (table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table
          .string('name', 20)
          .notNullable()
          .unique()
          .comment('Tag name (unique, max 20 characters)');
        table
          .string('color', 7)
          .notNullable()
          .comment('Hex color code (e.g., #FF0000)');
        table.timestamps(true, true);
        table
          .timestamp('deleted_at')
          .nullable()
          .comment('Soft delete timestamp');

        // Indexes for better query performance
        table.index(['name']);
        table.index(['deleted_at']);
      });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('tags');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .then(() => {
      return knex.schema.createTable('products', function (table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('name', 255).notNullable();
        table.text('description').nullable();
        table.decimal('price', 10, 2).notNullable();
        table.integer('stock_quantity').defaultTo(0);
        table.string('category', 100).nullable();
        table.timestamps(true, true);
        table
          .timestamp('deleted_at')
          .nullable()
          .comment('Soft delete timestamp');
        table
          .string('created_by', 255)
          .nullable()
          .comment('User who created the record');
        table
          .string('updated_by', 255)
          .nullable()
          .comment('User who last updated the record');

        table.index(['name']);
        table.index(['category']);
        table.index(['deleted_at']);
      });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('products');
};

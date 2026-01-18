/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createSchemaIfNotExists('product');

  return knex.schema
    .withSchema('product')
    .createTable('product_types', function (table) {
      table.increments('id').primary();
      table
        .string('name', 100)
        .unique()
        .notNullable()
        .comment('spare_part, tool, consumable, used_vehicle');
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index(['name']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('product').dropTable('product_types');
};

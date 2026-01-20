/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('product').createTable('products', function (table) {
    table.increments('id').primary();
    table
      .integer('business_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('business.businesses')
      .onDelete('CASCADE');
    table
      .integer('category_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('product.product_categories')
      .onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description');
    table.integer('price').notNullable().comment('in IDR');
    table.string('unit', 50).defaultTo('pcs').comment('pcs, unit, liter');
    table.enum('status', ['active', 'draft', 'archived']).defaultTo('draft');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').nullable();
    table.timestamp('deleted_at').nullable();

    table.index(['business_id']);
    table.index(['business_id', 'status']);
    table.index(['category_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('product').dropTable('products');
};

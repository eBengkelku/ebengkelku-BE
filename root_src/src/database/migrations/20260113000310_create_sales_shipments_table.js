/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('sales').createTable('shipments', function (table) {
    table.increments('id').primary();
    table
      .integer('sale_id')
      .unsigned()
      .unique()
      .notNullable()
      .references('id')
      .inTable('sales.sales')
      .onDelete('CASCADE')
      .comment('1:1 relationship');
    table.enum('method', ['pickup', 'delivery']).notNullable();
    table.text('address').nullable().comment('For delivery');
    table.string('tracking_number', 255).nullable();
    table.enum('status', ['pending', 'shipped', 'delivered']).defaultTo('pending');
    table.timestamp('shipped_at').nullable();
    table.timestamp('delivered_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').nullable();

    table.index(['sale_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('sales').dropTable('shipments');
};

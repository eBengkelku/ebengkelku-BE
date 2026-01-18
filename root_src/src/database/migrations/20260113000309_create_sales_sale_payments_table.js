/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('sales').createTable('sale_payments', function (table) {
    table.increments('id').primary();
    table
      .integer('sale_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('sales.sales')
      .onDelete('CASCADE');
    table.string('method', 100).notNullable().comment('cash, qris, transfer');
    table.integer('amount').notNullable();
    table.enum('status', ['pending', 'paid', 'failed']).defaultTo('pending');
    table.timestamp('paid_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['sale_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('sales').dropTable('sale_payments');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('sales').createTable('sales', function (table) {
    table.increments('id').primary();
    table
      .integer('business_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('business.businesses')
      .onDelete('CASCADE');
    table
      .integer('customer_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('core.users')
      .onDelete('CASCADE');
    table.enum('channel', ['online', 'pos', 'service']).notNullable();
    table.enum('status', ['pending', 'completed', 'cancelled']).defaultTo('pending');
    table.integer('total_amount').notNullable().comment('Sum of items + service_fee');
    table.integer('service_fee').defaultTo(0).comment('From services.price');
    table.integer('paid_amount').defaultTo(0).comment('Denormalized');
    table.enum('payment_status', ['unpaid', 'partial', 'paid']).defaultTo('unpaid');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').nullable();

    table.index(['business_id', 'created_at']);
    table.index(['customer_id']);
    table.index(['status']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('sales').dropTable('sales');
};

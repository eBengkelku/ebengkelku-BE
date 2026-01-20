/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('hr').createTable('employee_payrolls', function (table) {
    table.increments('id').primary();
    table
      .integer('employment_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('hr.employments')
      .onDelete('CASCADE');
    table.integer('year').notNullable();
    table.integer('month').notNullable().comment('1-12');
    table.integer('base_salary').notNullable().comment('in IDR');
    table.integer('bonus').defaultTo(0);
    table.integer('deductions').defaultTo(0);
    table.integer('net_salary').notNullable().comment('computed');
    table.timestamp('paid_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['employment_id', 'year', 'month']);
    table.index(['employment_id']);
    table.index(['year', 'month']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('hr').dropTable('employee_payrolls');
};

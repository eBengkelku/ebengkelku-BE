/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('hr').createTable('employee_attendances', function (table) {
    table.increments('id').primary();
    table
      .integer('employment_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('hr.employments')
      .onDelete('CASCADE');
    table.timestamp('check_in_time').notNullable();
    table.timestamp('check_out_time').nullable();
    table.enum('status', ['present', 'late', 'absent']).defaultTo('present');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['employment_id']);
    table.index(['check_in_time']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('hr').dropTable('employee_attendances');
};

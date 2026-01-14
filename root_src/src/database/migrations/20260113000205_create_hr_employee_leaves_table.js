/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('hr').createTable('employee_leaves', function (table) {
    table.increments('id').primary();
    table
      .integer('employment_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('hr.employments')
      .onDelete('CASCADE');
    table.enum('leave_type', ['sick', 'vacation']).notNullable();
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending');
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').nullable();

    table.index(['employment_id']);
    table.index(['status']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('hr').dropTable('employee_leaves');
};

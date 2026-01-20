/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('hr').createTable('employee_profiles', function (table) {
    table.increments('id').primary();
    table
      .integer('employment_id')
      .unsigned()
      .unique()
      .notNullable()
      .references('id')
      .inTable('hr.employments')
      .onDelete('CASCADE')
      .comment('1:1 relationship');
    table.date('date_of_birth');
    table.enum('gender', ['l', 'p']);
    table.string('national_id', 100);
    table.text('address');
    table.string('emergency_contact', 100);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').nullable();

    table.index(['employment_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('hr').dropTable('employee_profiles');
};

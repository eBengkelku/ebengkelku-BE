/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('hr').createTable('job_roles', function (table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable().comment('mechanic, cashier, admin');
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['name']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('hr').dropTable('job_roles');
};

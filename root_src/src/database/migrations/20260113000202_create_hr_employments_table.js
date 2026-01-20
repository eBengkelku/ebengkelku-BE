/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('hr').createTable('employments', function (table) {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('core.users')
      .onDelete('CASCADE');
    table
      .integer('business_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('business.businesses')
      .onDelete('CASCADE');
    table
      .integer('job_role_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('hr.job_roles')
      .onDelete('CASCADE');
    table
      .enum('status', ['active', 'inactive', 'terminated'])
      .defaultTo('active');
    table.timestamp('hired_at').notNullable();
    table.timestamp('ended_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').nullable();

    table.unique(['user_id', 'business_id']);
    table.index(['user_id']);
    table.index(['business_id']);
    table.index(['job_role_id']);
    table.index(['status']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('hr').dropTable('employments');
};

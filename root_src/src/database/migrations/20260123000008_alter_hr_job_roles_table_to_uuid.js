/**
 * Alter hr.job_roles table to use UUID primary key
 * Dependencies: hr.employments (job_role_id)
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Drop FK from hr.employments
  await knex.schema
    .withSchema('hr')
    .alterTable('employments', function (table) {
      table.dropForeign(['job_role_id']);
    });

  // Drop and recreate id as UUID
  await knex.schema.withSchema('hr').alterTable('job_roles', function (table) {
    table.dropColumn('id');
  });

  await knex.schema.withSchema('hr').alterTable('job_roles', function (table) {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('uuid_generate_v4()'))
      .notNullable()
      .first();
  });

  // Recreate FK column as UUID
  await knex.schema
    .withSchema('hr')
    .alterTable('employments', function (table) {
      table.dropColumn('job_role_id');
    });
  await knex.schema
    .withSchema('hr')
    .alterTable('employments', function (table) {
      table
        .uuid('job_role_id')
        .notNullable()
        .references('id')
        .inTable('hr.job_roles')
        .onDelete('CASCADE');
      table.index(['job_role_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Drop FK
  await knex.schema
    .withSchema('hr')
    .alterTable('employments', function (table) {
      table.dropForeign(['job_role_id']);
      table.dropColumn('job_role_id');
    });

  // Revert to integer
  await knex.schema.withSchema('hr').alterTable('job_roles', function (table) {
    table.dropColumn('id');
  });

  await knex.schema.withSchema('hr').alterTable('job_roles', function (table) {
    table.increments('id').primary().first();
  });

  // Recreate FK with integer
  await knex.schema
    .withSchema('hr')
    .alterTable('employments', function (table) {
      table
        .integer('job_role_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('hr.job_roles')
        .onDelete('CASCADE');
      table.index(['job_role_id']);
    });
};

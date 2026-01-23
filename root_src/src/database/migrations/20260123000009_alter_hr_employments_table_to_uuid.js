/**
 * Alter hr.employments table to use UUID primary key
 * Dependencies: employee_profiles, employee_attendances, employee_leaves, employee_payrolls, service_bookings
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Drop all FKs
  const fks = [
    { table: 'employee_profiles', column: 'employment_id' },
    { table: 'employee_attendances', column: 'employment_id' },
    { table: 'employee_leaves', column: 'employment_id' },
    { table: 'employee_payrolls', column: 'employment_id' },
  ];

  for (const { table, column } of fks) {
    await knex.schema.withSchema('hr').alterTable(table, function (t) {
      t.dropForeign([column]);
    });
  }

  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table.dropForeign(['assigned_employment_id']);
    });

  // Drop and recreate id as UUID
  await knex.schema
    .withSchema('hr')
    .alterTable('employments', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('hr')
    .alterTable('employments', function (table) {
      table
        .uuid('id')
        .primary()
        .defaultTo(knex.raw('uuid_generate_v4()'))
        .notNullable()
        .first();
    });

  // Recreate FK columns as UUID
  for (const { table, column } of fks) {
    await knex.schema.withSchema('hr').alterTable(table, function (t) {
      t.dropColumn(column);
    });
    await knex.schema.withSchema('hr').alterTable(table, function (t) {
      t.uuid(column)
        .notNullable()
        .references('id')
        .inTable('hr.employments')
        .onDelete('CASCADE');
      t.index([column]);
    });
  }

  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table.dropColumn('assigned_employment_id');
    });
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table
        .uuid('assigned_employment_id')
        .nullable()
        .references('id')
        .inTable('hr.employments')
        .onDelete('SET NULL');
      table.index(['assigned_employment_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const fks = [
    { table: 'employee_profiles', column: 'employment_id' },
    { table: 'employee_attendances', column: 'employment_id' },
    { table: 'employee_leaves', column: 'employment_id' },
    { table: 'employee_payrolls', column: 'employment_id' },
  ];

  // Drop FKs
  for (const { table, column } of fks) {
    await knex.schema.withSchema('hr').alterTable(table, function (t) {
      t.dropForeign([column]);
      t.dropColumn(column);
    });
  }
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table.dropForeign(['assigned_employment_id']);
      table.dropColumn('assigned_employment_id');
    });

  // Revert to integer
  await knex.schema
    .withSchema('hr')
    .alterTable('employments', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('hr')
    .alterTable('employments', function (table) {
      table.increments('id').primary().first();
    });

  // Recreate FKs with integer
  for (const { table, column } of fks) {
    await knex.schema.withSchema('hr').alterTable(table, function (t) {
      t.integer(column)
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('hr.employments')
        .onDelete('CASCADE');
      t.index([column]);
    });
  }
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table
        .integer('assigned_employment_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('hr.employments')
        .onDelete('SET NULL');
      table.index(['assigned_employment_id']);
    });
};

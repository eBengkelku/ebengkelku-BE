/**
 * Alter sales.sales table to use UUID primary key
 * Dependencies: sale_items, sale_payments, shipments, service_bookings
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Drop all FKs
  await knex.schema
    .withSchema('sales')
    .alterTable('sale_items', function (table) {
      table.dropForeign(['sale_id']);
    });
  await knex.schema
    .withSchema('sales')
    .alterTable('sale_payments', function (table) {
      table.dropForeign(['sale_id']);
    });
  await knex.schema
    .withSchema('sales')
    .alterTable('shipments', function (table) {
      table.dropForeign(['sale_id']);
    });
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table.dropForeign(['sale_id']);
    });

  // Drop and recreate id as UUID
  await knex.schema.withSchema('sales').alterTable('sales', function (table) {
    table.dropColumn('id');
  });

  await knex.schema.withSchema('sales').alterTable('sales', function (table) {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('uuid_generate_v4()'))
      .notNullable()
      .first();
  });

  // Recreate FK columns as UUID
  await knex.schema
    .withSchema('sales')
    .alterTable('sale_items', function (table) {
      table.dropColumn('sale_id');
    });
  await knex.schema
    .withSchema('sales')
    .alterTable('sale_items', function (table) {
      table
        .uuid('sale_id')
        .notNullable()
        .references('id')
        .inTable('sales.sales')
        .onDelete('CASCADE');
      table.index(['sale_id']);
    });

  await knex.schema
    .withSchema('sales')
    .alterTable('sale_payments', function (table) {
      table.dropColumn('sale_id');
    });
  await knex.schema
    .withSchema('sales')
    .alterTable('sale_payments', function (table) {
      table
        .uuid('sale_id')
        .notNullable()
        .references('id')
        .inTable('sales.sales')
        .onDelete('CASCADE');
      table.index(['sale_id']);
    });

  await knex.schema
    .withSchema('sales')
    .alterTable('shipments', function (table) {
      table.dropColumn('sale_id');
    });
  await knex.schema
    .withSchema('sales')
    .alterTable('shipments', function (table) {
      table
        .uuid('sale_id')
        .notNullable()
        .references('id')
        .inTable('sales.sales')
        .onDelete('CASCADE');
      table.index(['sale_id']);
    });

  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table.dropColumn('sale_id');
    });
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table
        .uuid('sale_id')
        .nullable()
        .references('id')
        .inTable('sales.sales')
        .onDelete('SET NULL');
      table.index(['sale_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Drop all FKs
  const drops = [
    { schema: 'sales', table: 'sale_items', column: 'sale_id' },
    { schema: 'sales', table: 'sale_payments', column: 'sale_id' },
    { schema: 'sales', table: 'shipments', column: 'sale_id' },
    { schema: 'service', table: 'service_bookings', column: 'sale_id' },
  ];

  for (const { schema, table, column } of drops) {
    await knex.schema.withSchema(schema).alterTable(table, function (t) {
      t.dropForeign([column]);
      t.dropColumn(column);
    });
  }

  // Revert to integer
  await knex.schema.withSchema('sales').alterTable('sales', function (table) {
    table.dropColumn('id');
  });

  await knex.schema.withSchema('sales').alterTable('sales', function (table) {
    table.increments('id').primary().first();
  });

  // Recreate FKs with integer
  await knex.schema
    .withSchema('sales')
    .alterTable('sale_items', function (table) {
      table
        .integer('sale_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('sales.sales')
        .onDelete('CASCADE');
      table.index(['sale_id']);
    });

  await knex.schema
    .withSchema('sales')
    .alterTable('sale_payments', function (table) {
      table
        .integer('sale_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('sales.sales')
        .onDelete('CASCADE');
      table.index(['sale_id']);
    });

  await knex.schema
    .withSchema('sales')
    .alterTable('shipments', function (table) {
      table
        .integer('sale_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('sales.sales')
        .onDelete('CASCADE');
      table.index(['sale_id']);
    });

  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table
        .integer('sale_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('sales.sales')
        .onDelete('SET NULL');
      table.index(['sale_id']);
    });
};

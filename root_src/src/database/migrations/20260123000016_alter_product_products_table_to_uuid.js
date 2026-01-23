/**
 * Alter product.products table to use UUID primary key
 * Dependencies: inventories, spare_part_products, tool_products, used_vehicle_products, sale_items
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Drop all FKs
  await knex.schema
    .withSchema('product')
    .alterTable('inventories', function (table) {
      table.dropForeign(['product_id']);
    });
  await knex.schema
    .withSchema('product')
    .alterTable('spare_part_products', function (table) {
      table.dropForeign(['product_id']);
    });
  await knex.schema
    .withSchema('product')
    .alterTable('tool_products', function (table) {
      table.dropForeign(['product_id']);
    });
  await knex.schema
    .withSchema('vehicle')
    .alterTable('used_vehicle_products', function (table) {
      table.dropForeign(['product_id']);
    });
  await knex.schema
    .withSchema('sales')
    .alterTable('sale_items', function (table) {
      table.dropForeign(['product_id']);
    });

  // Drop and recreate id as UUID
  await knex.schema
    .withSchema('product')
    .alterTable('products', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('product')
    .alterTable('products', function (table) {
      table
        .uuid('id')
        .primary()
        .defaultTo(knex.raw('uuid_generate_v4()'))
        .notNullable()
        .first();
    });

  // Recreate FK columns as UUID
  await knex.schema
    .withSchema('product')
    .alterTable('inventories', function (table) {
      table.dropColumn('product_id');
    });
  await knex.schema
    .withSchema('product')
    .alterTable('inventories', function (table) {
      table
        .uuid('product_id')
        .notNullable()
        .references('id')
        .inTable('product.products')
        .onDelete('CASCADE');
      table.index(['product_id']);
    });

  await knex.schema
    .withSchema('product')
    .alterTable('spare_part_products', function (table) {
      table.dropColumn('product_id');
    });
  await knex.schema
    .withSchema('product')
    .alterTable('spare_part_products', function (table) {
      table
        .uuid('product_id')
        .primary()
        .references('id')
        .inTable('product.products')
        .onDelete('CASCADE');
    });

  await knex.schema
    .withSchema('product')
    .alterTable('tool_products', function (table) {
      table.dropColumn('product_id');
    });
  await knex.schema
    .withSchema('product')
    .alterTable('tool_products', function (table) {
      table
        .uuid('product_id')
        .primary()
        .references('id')
        .inTable('product.products')
        .onDelete('CASCADE');
    });

  await knex.schema
    .withSchema('vehicle')
    .alterTable('used_vehicle_products', function (table) {
      table.dropColumn('product_id');
    });
  await knex.schema
    .withSchema('vehicle')
    .alterTable('used_vehicle_products', function (table) {
      table
        .uuid('product_id')
        .primary()
        .references('id')
        .inTable('product.products')
        .onDelete('CASCADE');
    });

  await knex.schema
    .withSchema('sales')
    .alterTable('sale_items', function (table) {
      table.dropColumn('product_id');
    });
  await knex.schema
    .withSchema('sales')
    .alterTable('sale_items', function (table) {
      table
        .uuid('product_id')
        .notNullable()
        .references('id')
        .inTable('product.products')
        .onDelete('CASCADE');
      table.index(['product_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Drop all FKs
  const drops = [
    { schema: 'product', table: 'inventories', column: 'product_id' },
    { schema: 'product', table: 'spare_part_products', column: 'product_id' },
    { schema: 'product', table: 'tool_products', column: 'product_id' },
    { schema: 'vehicle', table: 'used_vehicle_products', column: 'product_id' },
    { schema: 'sales', table: 'sale_items', column: 'product_id' },
  ];

  for (const { schema, table, column } of drops) {
    await knex.schema.withSchema(schema).alterTable(table, function (t) {
      t.dropForeign([column]);
      t.dropColumn(column);
    });
  }

  // Revert to integer
  await knex.schema
    .withSchema('product')
    .alterTable('products', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('product')
    .alterTable('products', function (table) {
      table.increments('id').primary().first();
    });

  // Recreate FKs with integer
  await knex.schema
    .withSchema('product')
    .alterTable('inventories', function (table) {
      table
        .integer('product_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('product.products')
        .onDelete('CASCADE');
      table.index(['product_id']);
    });

  await knex.schema
    .withSchema('product')
    .alterTable('spare_part_products', function (table) {
      table
        .integer('product_id')
        .unsigned()
        .primary()
        .references('id')
        .inTable('product.products')
        .onDelete('CASCADE');
    });

  await knex.schema
    .withSchema('product')
    .alterTable('tool_products', function (table) {
      table
        .integer('product_id')
        .unsigned()
        .primary()
        .references('id')
        .inTable('product.products')
        .onDelete('CASCADE');
    });

  await knex.schema
    .withSchema('vehicle')
    .alterTable('used_vehicle_products', function (table) {
      table
        .integer('product_id')
        .unsigned()
        .primary()
        .references('id')
        .inTable('product.products')
        .onDelete('CASCADE');
    });

  await knex.schema
    .withSchema('sales')
    .alterTable('sale_items', function (table) {
      table
        .integer('product_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('product.products')
        .onDelete('CASCADE');
      table.index(['product_id']);
    });
};

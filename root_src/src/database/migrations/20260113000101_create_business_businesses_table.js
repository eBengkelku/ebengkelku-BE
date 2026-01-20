/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createSchemaIfNotExists('business');

  return knex.schema
    .withSchema('business')
    .createTable('businesses', function (table) {
      table.increments('id').primary();
      table
        .integer('owner_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('core.users')
        .onDelete('CASCADE');
      table.string('name', 255).notNullable();
      table.string('tagline', 500);
      table
        .enum('status', ['pending', 'active', 'banned'])
        .defaultTo('pending');
      table.string('phone', 50);
      table.string('image', 500);
      table.string('cover_image', 500);
      table.decimal('latitude', 11, 8);
      table.decimal('longitude', 11, 8);
      table.text('address');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').nullable();
      table.timestamp('deleted_at').nullable();

      table.index(['owner_id']);
      table.index(['status']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('business').dropTable('businesses');
};

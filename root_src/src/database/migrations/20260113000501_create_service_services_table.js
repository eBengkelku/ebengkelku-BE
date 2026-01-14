/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('service').createTable('services', function (table) {
    table.increments('id').primary();
    table
      .integer('business_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('business.businesses')
      .onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description');
    table.integer('price').notNullable().comment('in IDR');
    table.integer('duration_minutes');
    table.integer('daily_quota').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').nullable();
    table.timestamp('deleted_at').nullable();

    table.index(['business_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('service').dropTable('services');
};

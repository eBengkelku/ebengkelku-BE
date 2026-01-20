/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('business').createTable('business_hours', function (table) {
    table.increments('id').primary();
    table
      .integer('business_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('business.businesses')
      .onDelete('CASCADE');
    table.integer('day_of_week').notNullable().comment('0 = Sunday, 6 = Saturday');
    table.time('open_time');
    table.time('close_time');

    table.unique(['business_id', 'day_of_week']);
    table.index(['business_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('business').dropTable('business_hours');
};

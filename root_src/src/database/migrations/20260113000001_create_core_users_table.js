/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .then(() => {
      return knex.schema
        .withSchema('core')
        .createTable('users', function (table) {
          table.increments('id').primary();
          table
            .uuid('public_id')
            .unique()
            .notNullable()
            .defaultTo(knex.raw('uuid_generate_v4()'));
          table.string('name', 255).notNullable();
          table.string('email', 255).unique();
          table.string('phone', 50);
          table.string('password', 255);
          table.string('image', 500);
          table.string('provider', 100);
          table.string('provider_id', 255);
          table.timestamp('email_verified_at').nullable();
          table.timestamp('created_at').defaultTo(knex.fn.now());
          table.timestamp('updated_at').nullable();
          table.timestamp('deleted_at').nullable();

          table.index(['email']);
          table.index(['phone']);
          table.index(['public_id']);
        });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('core').dropTable('users');
};

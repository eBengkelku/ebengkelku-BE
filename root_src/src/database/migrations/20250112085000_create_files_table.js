/**
 * Create files table migration
 * This table stores file metadata and paths for file uploads
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('files', function (table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .string('file_path', 500)
      .notNullable()
      .comment('Physical file path on server');
    table
      .string('original_name', 255)
      .notNullable()
      .comment('Original filename from upload');
    table
      .string('mime_type', 100)
      .notNullable()
      .comment('MIME type of the file');
    table
      .integer('file_size')
      .unsigned()
      .notNullable()
      .comment('File size in bytes');
    table
      .string('file_type', 50)
      .notNullable()
      .comment('General file type (image, document, etc.)');
    table.string('extension', 10).notNullable().comment('File extension');
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable().comment('Soft delete timestamp');

    // Indexes for better query performance
    table.index(['file_type']);
    table.index(['mime_type']);
    table.index(['created_at']);
    table.index(['deleted_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('files');
};

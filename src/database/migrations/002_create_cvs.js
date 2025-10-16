exports.up = function(knex) {
  return knex.schema.createTable('cvs', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(4))) || "-" || lower(hex(randomblob(2))) || "-4" || substr(lower(hex(randomblob(2))),2) || "-" || substr("89ab",abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || "-" || lower(hex(randomblob(6))))'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('original_content').nullable();
    table.text('rewritten_content').nullable();
    table.string('target_role').nullable();
    table.string('target_industry').nullable();
    table.json('keywords_added').nullable(); // Array of keywords
    table.integer('original_score').nullable();
    table.integer('improved_score').nullable();
    table.enum('status', ['draft', 'processing', 'completed', 'failed']).defaultTo('draft');
    table.string('file_path').nullable(); // For uploaded CV files
    table.string('file_type').nullable();
    table.integer('file_size').nullable();
    table.json('ai_feedback').nullable(); // Detailed AI analysis
    table.boolean('is_favorite').defaultTo(false);
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('status');
    table.index('target_role');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('cvs');
};
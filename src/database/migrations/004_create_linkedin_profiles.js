exports.up = function(knex) {
  return knex.schema.createTable('linkedin_profiles', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(4))) || "-" || lower(hex(randomblob(2))) || "-4" || substr(lower(hex(randomblob(2))),2) || "-" || substr("89ab",abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || "-" || lower(hex(randomblob(6))))'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('linkedin_url').nullable();
    table.text('original_headline').nullable();
    table.text('optimized_headline').nullable();
    table.text('original_summary').nullable();
    table.text('optimized_summary').nullable();
    table.json('original_skills').nullable(); // Array of skills
    table.json('optimized_skills').nullable(); // Array of optimized skills
    table.json('keyword_suggestions').nullable();
    table.integer('profile_strength_before').nullable();
    table.integer('profile_strength_after').nullable();
    table.enum('status', ['draft', 'processing', 'completed', 'failed']).defaultTo('draft');
    table.json('ai_recommendations').nullable();
    table.boolean('applied_to_linkedin').defaultTo(false);
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('status');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('linkedin_profiles');
};
exports.up = function(knex) {
  return knex.schema.createTable('job_applications', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(4))) || "-" || lower(hex(randomblob(2))) || "-4" || substr(lower(hex(randomblob(2))),2) || "-" || substr("89ab",abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || "-" || lower(hex(randomblob(6))))'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('job_id').references('id').inTable('jobs').onDelete('CASCADE');
    table.uuid('cv_id').references('id').inTable('cvs').nullable();
    table.enum('status', ['saved', 'applied', 'interview_scheduled', 'interview_completed', 'offer_received', 'rejected', 'withdrawn']).defaultTo('saved');
    table.text('cover_letter').nullable();
    table.text('notes').nullable();
    table.integer('match_score').nullable(); // AI-calculated match score
    table.json('match_analysis').nullable(); // Detailed matching analysis
    table.timestamp('applied_at').nullable();
    table.timestamp('last_updated_at').nullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('job_id');
    table.index('status');
    table.unique(['user_id', 'job_id']); // Prevent duplicate applications
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('job_applications');
};
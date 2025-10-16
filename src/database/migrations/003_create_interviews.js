exports.up = function(knex) {
  return knex.schema.createTable('interviews', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(4))) || "-" || lower(hex(randomblob(2))) || "-4" || substr(lower(hex(randomblob(2))),2) || "-" || substr("89ab",abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || "-" || lower(hex(randomblob(6))))'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('job_role').notNullable();
    table.string('company_name').nullable();
    table.enum('experience_level', ['entry', 'junior', 'mid', 'senior', 'executive']).defaultTo('mid');
    table.enum('interview_type', ['behavioral', 'technical', 'case_study', 'mixed']).defaultTo('mixed');
    table.json('questions').nullable(); // Array of questions and answers
    table.json('feedback').nullable(); // AI feedback for each answer
    table.integer('overall_score').nullable();
    table.integer('duration_minutes').nullable();
    table.enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled']).defaultTo('scheduled');
    table.timestamp('started_at').nullable();
    table.timestamp('completed_at').nullable();
    table.json('performance_metrics').nullable(); // Speaking pace, confidence, etc.
    table.text('improvement_suggestions').nullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('job_role');
    table.index('status');
    table.index('experience_level');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('interviews');
};
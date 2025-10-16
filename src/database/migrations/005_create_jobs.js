exports.up = function(knex) {
  return knex.schema.createTable('jobs', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(4))) || "-" || lower(hex(randomblob(2))) || "-4" || substr(lower(hex(randomblob(2))),2) || "-" || substr("89ab",abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || "-" || lower(hex(randomblob(6))))'));
    table.string('title').notNullable();
    table.string('company').notNullable();
    table.text('description').nullable();
    table.string('location').nullable();
    table.string('salary_range').nullable();
    table.enum('employment_type', ['full_time', 'part_time', 'contract', 'internship']).defaultTo('full_time');
    table.enum('experience_level', ['entry', 'junior', 'mid', 'senior', 'executive']).defaultTo('mid');
    table.json('required_skills').nullable(); // Array of skills
    table.json('preferred_skills').nullable(); // Array of preferred skills
    table.string('external_url').nullable(); // Link to original job posting
    table.string('source').nullable(); // Where the job was scraped from
    table.boolean('is_active').defaultTo(true);
    table.timestamp('posted_at').nullable();
    table.timestamp('expires_at').nullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index('title');
    table.index('company');
    table.index('location');
    table.index('experience_level');
    table.index('employment_type');
    table.index('is_active');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('jobs');
};
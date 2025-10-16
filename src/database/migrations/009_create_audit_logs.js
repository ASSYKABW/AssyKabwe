exports.up = function(knex) {
  return knex.schema.createTable('audit_logs', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(4))) || "-" || lower(hex(randomblob(2))) || "-4" || substr(lower(hex(randomblob(2))),2) || "-" || substr("89ab",abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || "-" || lower(hex(randomblob(6))))'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL').nullable();
    table.string('action').notNullable(); // e.g., 'cv_rewrite', 'interview_start', 'payment_completed'
    table.string('resource_type').nullable(); // e.g., 'cv', 'interview', 'payment'
    table.uuid('resource_id').nullable(); // ID of the affected resource
    table.json('details').nullable(); // Additional context
    table.string('ip_address').nullable();
    table.string('user_agent').nullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('action');
    table.index('resource_type');
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('audit_logs');
};
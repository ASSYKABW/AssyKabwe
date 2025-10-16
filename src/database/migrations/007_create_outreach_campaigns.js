exports.up = function(knex) {
  return knex.schema.createTable('outreach_campaigns', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(4))) || "-" || lower(hex(randomblob(2))) || "-4" || substr(lower(hex(randomblob(2))),2) || "-" || substr("89ab",abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || "-" || lower(hex(randomblob(6))))'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('campaign_name').notNullable();
    table.string('target_role').notNullable();
    table.string('target_industry').nullable();
    table.string('target_location').nullable();
    table.integer('target_companies_count').defaultTo(0);
    table.integer('messages_sent').defaultTo(0);
    table.integer('responses_received').defaultTo(0);
    table.integer('interviews_scheduled').defaultTo(0);
    table.enum('status', ['draft', 'active', 'paused', 'completed', 'cancelled']).defaultTo('draft');
    table.text('message_template').nullable();
    table.json('target_companies').nullable(); // Array of company names/IDs
    table.json('campaign_settings').nullable(); // Frequency, timing, etc.
    table.timestamp('started_at').nullable();
    table.timestamp('completed_at').nullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('status');
    table.index('target_role');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('outreach_campaigns');
};
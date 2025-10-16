exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(4))) || "-" || lower(hex(randomblob(2))) || "-4" || substr(lower(hex(randomblob(2))),2) || "-" || substr("89ab",abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || "-" || lower(hex(randomblob(6))))'));
    table.string('full_name').notNullable();
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.enum('role', ['seeker', 'recruiter', 'admin']).defaultTo('seeker');
    table.enum('subscription_tier', ['basic', 'pro', 'executive', 'corporate']).defaultTo('basic');
    table.string('stripe_customer_id').nullable();
    table.string('subscription_id').nullable();
    table.timestamp('subscription_expires_at').nullable();
    table.boolean('email_verified').defaultTo(false);
    table.string('verification_token').nullable();
    table.string('reset_password_token').nullable();
    table.timestamp('reset_password_expires').nullable();
    table.json('profile_data').nullable(); // Store additional profile info
    table.integer('cv_rewrites_used').defaultTo(0);
    table.integer('interview_sessions_used').defaultTo(0);
    table.integer('linkedin_optimizations_used').defaultTo(0);
    table.timestamp('last_login_at').nullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index('email');
    table.index('role');
    table.index('subscription_tier');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
exports.up = function(knex) {
  return knex.schema.createTable('payments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(4))) || "-" || lower(hex(randomblob(2))) || "-4" || substr(lower(hex(randomblob(2))),2) || "-" || substr("89ab",abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || "-" || lower(hex(randomblob(6))))'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('stripe_payment_intent_id').nullable();
    table.string('payfast_payment_id').nullable();
    table.enum('payment_provider', ['stripe', 'payfast']).notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('ZAR');
    table.enum('subscription_tier', ['basic', 'pro', 'executive', 'corporate']).notNullable();
    table.enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded']).defaultTo('pending');
    table.json('payment_metadata').nullable(); // Store additional payment info
    table.timestamp('paid_at').nullable();
    table.timestamp('expires_at').nullable(); // For subscription expiry
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('status');
    table.index('payment_provider');
    table.index('stripe_payment_intent_id');
    table.index('payfast_payment_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payments');
};
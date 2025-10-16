const knex = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

class Payment {
  static async create(paymentData) {
    const payment = {
      id: uuidv4(),
      ...paymentData,
      created_at: new Date(),
      updated_at: new Date()
    };

    const [createdPayment] = await knex('payments').insert(payment).returning('*');
    return createdPayment;
  }

  static async findById(id) {
    return await knex('payments').where({ id }).first();
  }

  static async findByUserId(userId, limit = 10, offset = 0) {
    return await knex('payments')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  static async findByStripePaymentIntentId(paymentIntentId) {
    return await knex('payments')
      .where({ stripe_payment_intent_id: paymentIntentId })
      .first();
  }

  static async findByPayFastPaymentId(paymentId) {
    return await knex('payments')
      .where({ payfast_payment_id: paymentId })
      .first();
  }

  static async update(id, updates) {
    const [updatedPayment] = await knex('payments')
      .where({ id })
      .update({
        ...updates,
        updated_at: new Date()
      })
      .returning('*');
    
    return updatedPayment;
  }

  static async getUserPaymentHistory(userId, limit = 20, offset = 0) {
    return await knex('payments')
      .where({ user_id: userId })
      .whereIn('status', ['completed', 'refunded'])
      .orderBy('paid_at', 'desc')
      .limit(limit)
      .offset(offset)
      .select('id', 'amount', 'currency', 'subscription_tier', 'status', 'paid_at', 'expires_at', 'payment_provider');
  }

  static async getActiveSubscription(userId) {
    return await knex('payments')
      .where({ user_id: userId, status: 'completed' })
      .where('expires_at', '>', new Date())
      .orderBy('expires_at', 'desc')
      .first();
  }

  static async getPaymentStats() {
    const stats = await knex('payments')
      .select('subscription_tier', 'payment_provider')
      .sum('amount as total_amount')
      .count('* as count')
      .where('status', 'completed')
      .groupBy('subscription_tier', 'payment_provider');
    
    return stats;
  }

  static async getMonthlyRevenue(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const result = await knex('payments')
      .sum('amount as total_revenue')
      .count('* as total_payments')
      .where('status', 'completed')
      .whereBetween('paid_at', [startDate, endDate])
      .first();

    return {
      total_revenue: parseFloat(result.total_revenue || 0),
      total_payments: parseInt(result.total_payments || 0)
    };
  }
}

module.exports = Payment;
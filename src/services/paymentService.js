const Stripe = require('stripe');
const crypto = require('crypto');
const axios = require('axios');
const logger = require('../utils/logger');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  // Stripe Integration
  static async createStripeCheckoutSession(userId, plan, successUrl, cancelUrl) {
    try {
      const priceMap = {
        basic: null, // Free plan
        pro: 'price_pro_monthly', // Replace with actual Stripe price ID
        executive: 'price_executive_monthly', // Replace with actual Stripe price ID
        corporate: 'price_corporate_monthly' // Replace with actual Stripe price ID
      };

      if (plan === 'basic') {
        throw new Error('Basic plan is free and does not require payment');
      }

      const priceId = priceMap[plan];
      if (!priceId) {
        throw new Error('Invalid subscription plan');
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: userId,
        metadata: {
          userId,
          plan
        }
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url
      };
    } catch (error) {
      logger.error('Stripe checkout session creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async handleStripeWebhook(event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleStripeSubscriptionSuccess(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleStripeSubscriptionUpdate(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleStripeSubscriptionCancellation(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handleStripePaymentFailed(event.data.object);
          break;
        default:
          logger.info(`Unhandled Stripe event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      logger.error('Stripe webhook handling failed:', error);
      return { success: false, error: error.message };
    }
  }

  static async handleStripeSubscriptionSuccess(session) {
    const User = require('../models/User');
    const Payment = require('../models/Payment');

    const userId = session.client_reference_id;
    const plan = session.metadata.plan;

    // Update user subscription
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

    await User.update(userId, {
      subscription_tier: plan,
      subscription_expires_at: expiresAt,
      stripe_customer_id: session.customer
    });

    // Create payment record
    await Payment.create({
      user_id: userId,
      stripe_payment_intent_id: session.payment_intent,
      payment_provider: 'stripe',
      amount: session.amount_total / 100, // Convert from cents
      currency: session.currency.toUpperCase(),
      subscription_tier: plan,
      status: 'completed',
      paid_at: new Date(),
      expires_at: expiresAt
    });

    logger.info(`Stripe subscription activated for user: ${userId}, plan: ${plan}`);
  }

  static async handleStripeSubscriptionUpdate(subscription) {
    const User = require('../models/User');
    
    const customer = await stripe.customers.retrieve(subscription.customer);
    const user = await User.findByStripeCustomerId(customer.id);
    
    if (user) {
      const expiresAt = new Date(subscription.current_period_end * 1000);
      
      await User.update(user.id, {
        subscription_expires_at: expiresAt
      });

      logger.info(`Stripe subscription updated for user: ${user.id}`);
    }
  }

  static async handleStripeSubscriptionCancellation(subscription) {
    const User = require('../models/User');
    
    const customer = await stripe.customers.retrieve(subscription.customer);
    const user = await User.findByStripeCustomerId(customer.id);
    
    if (user) {
      await User.update(user.id, {
        subscription_tier: 'basic',
        subscription_expires_at: null
      });

      logger.info(`Stripe subscription cancelled for user: ${user.id}`);
    }
  }

  static async handleStripePaymentFailed(invoice) {
    // Handle failed payment - could send email notification, etc.
    logger.warn(`Stripe payment failed for customer: ${invoice.customer}`);
  }

  // PayFast Integration (South African payment gateway)
  static generatePayFastSignature(data, passphrase = '') {
    // Create parameter string
    let pfParamString = '';
    for (const key in data) {
      if (data.hasOwnProperty(key) && data[key] !== '') {
        pfParamString += `${key}=${encodeURIComponent(data[key].toString().trim()).replace(/%20/g, '+')}&`;
      }
    }

    // Remove last ampersand
    pfParamString = pfParamString.slice(0, -1);

    // Add passphrase if provided
    if (passphrase) {
      pfParamString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
    }

    // Generate signature
    return crypto.createHash('md5').update(pfParamString).digest('hex');
  }

  static async createPayFastPayment(userId, plan, successUrl, cancelUrl) {
    try {
      const priceMap = {
        basic: 0, // Free plan
        pro: 129.00, // R129 per month
        executive: 549.00, // R549 per month
        corporate: null // Custom pricing
      };

      if (plan === 'basic') {
        throw new Error('Basic plan is free and does not require payment');
      }

      if (plan === 'corporate') {
        throw new Error('Corporate plan requires custom pricing');
      }

      const amount = priceMap[plan];
      if (!amount) {
        throw new Error('Invalid subscription plan');
      }

      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const data = {
        merchant_id: process.env.PAYFAST_MERCHANT_ID,
        merchant_key: process.env.PAYFAST_MERCHANT_KEY,
        return_url: successUrl,
        cancel_url: cancelUrl,
        notify_url: `${process.env.BASE_URL}/api/webhooks/payfast`,
        name_first: user.full_name.split(' ')[0],
        name_last: user.full_name.split(' ').slice(1).join(' '),
        email_address: user.email,
        m_payment_id: `${userId}_${plan}_${Date.now()}`,
        amount: amount.toFixed(2),
        item_name: `CareerBoost ${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription`,
        item_description: `Monthly subscription to CareerBoost ${plan} plan`,
        custom_str1: userId,
        custom_str2: plan
      };

      // Generate signature
      data.signature = this.generatePayFastSignature(data, process.env.PAYFAST_PASSPHRASE);

      const baseUrl = process.env.PAYFAST_SANDBOX === 'true' 
        ? 'https://sandbox.payfast.co.za/eng/process'
        : 'https://www.payfast.co.za/eng/process';

      return {
        success: true,
        paymentUrl: baseUrl,
        paymentData: data
      };
    } catch (error) {
      logger.error('PayFast payment creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async handlePayFastWebhook(postData) {
    try {
      // Verify the signature
      const signature = postData.signature;
      delete postData.signature;

      const generatedSignature = this.generatePayFastSignature(postData, process.env.PAYFAST_PASSPHRASE);

      if (signature !== generatedSignature) {
        throw new Error('Invalid PayFast signature');
      }

      // Verify payment status
      if (postData.payment_status === 'COMPLETE') {
        await this.handlePayFastPaymentSuccess(postData);
      } else {
        logger.warn(`PayFast payment not complete: ${postData.payment_status}`);
      }

      return { success: true };
    } catch (error) {
      logger.error('PayFast webhook handling failed:', error);
      return { success: false, error: error.message };
    }
  }

  static async handlePayFastPaymentSuccess(postData) {
    const User = require('../models/User');
    const Payment = require('../models/Payment');

    const userId = postData.custom_str1;
    const plan = postData.custom_str2;

    // Update user subscription
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

    await User.update(userId, {
      subscription_tier: plan,
      subscription_expires_at: expiresAt
    });

    // Create payment record
    await Payment.create({
      user_id: userId,
      payfast_payment_id: postData.pf_payment_id,
      payment_provider: 'payfast',
      amount: parseFloat(postData.amount_gross),
      currency: 'ZAR',
      subscription_tier: plan,
      status: 'completed',
      paid_at: new Date(),
      expires_at: expiresAt,
      payment_metadata: postData
    });

    logger.info(`PayFast subscription activated for user: ${userId}, plan: ${plan}`);
  }

  // General subscription management
  static async cancelSubscription(userId) {
    try {
      const User = require('../models/User');
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Cancel Stripe subscription if exists
      if (user.stripe_customer_id) {
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'active'
        });

        for (const subscription of subscriptions.data) {
          await stripe.subscriptions.update(subscription.id, {
            cancel_at_period_end: true
          });
        }
      }

      // Update user to basic plan
      await User.update(userId, {
        subscription_tier: 'basic',
        subscription_expires_at: null
      });

      logger.info(`Subscription cancelled for user: ${userId}`);

      return { success: true };
    } catch (error) {
      logger.error('Subscription cancellation failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = PaymentService;
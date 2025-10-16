const express = require('express');
const Stripe = require('stripe');
const PaymentService = require('../services/paymentService');
const logger = require('../utils/logger');

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Stripe webhook endpoint
// @route   POST /api/webhooks/stripe
// @access  Public (but verified)
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const result = await PaymentService.handleStripeWebhook(event);
    
    if (!result.success) {
      logger.error('Stripe webhook processing failed:', result.error);
      return res.status(500).json({ error: result.error });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// @desc    PayFast webhook endpoint
// @route   POST /api/webhooks/payfast
// @access  Public (but verified)
router.post('/payfast', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    logger.info('PayFast webhook received:', req.body);

    const result = await PaymentService.handlePayFastWebhook(req.body);
    
    if (!result.success) {
      logger.error('PayFast webhook processing failed:', result.error);
      return res.status(500).send('Webhook processing failed');
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error('PayFast webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// @desc    Generic webhook for other integrations
// @route   POST /api/webhooks/generic
// @access  Public (but should be secured in production)
router.post('/generic', express.json(), async (req, res) => {
  try {
    logger.info('Generic webhook received:', {
      headers: req.headers,
      body: req.body
    });

    // Handle other webhook types here (LinkedIn, job boards, etc.)
    
    res.json({ received: true });
  } catch (error) {
    logger.error('Generic webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const PaymentService = require('../services/paymentService');
const Payment = require('../models/Payment');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Create Stripe checkout session
// @route   POST /api/payments/stripe/create-checkout
// @access  Private
router.post('/stripe/create-checkout', protect, [
  body('plan').isIn(['pro', 'executive', 'corporate']).withMessage('Invalid subscription plan'),
  body('success_url').isURL().withMessage('Valid success URL is required'),
  body('cancel_url').isURL().withMessage('Valid cancel URL is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { plan, success_url, cancel_url } = req.body;

    const result = await PaymentService.createStripeCheckoutSession(
      req.user.id,
      plan,
      success_url,
      cancel_url
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: {
        session_id: result.sessionId,
        checkout_url: result.url
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create PayFast payment
// @route   POST /api/payments/payfast/create-payment
// @access  Private
router.post('/payfast/create-payment', protect, [
  body('plan').isIn(['pro', 'executive']).withMessage('Invalid subscription plan'),
  body('success_url').isURL().withMessage('Valid success URL is required'),
  body('cancel_url').isURL().withMessage('Valid cancel URL is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { plan, success_url, cancel_url } = req.body;

    const result = await PaymentService.createPayFastPayment(
      req.user.id,
      plan,
      success_url,
      cancel_url
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: {
        payment_url: result.paymentUrl,
        payment_data: result.paymentData
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user's payment history
// @route   GET /api/payments/history
// @access  Private
router.get('/history', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const payments = await Payment.getUserPaymentHistory(
      req.user.id,
      parseInt(limit),
      offset
    );

    const totalCount = await Payment.findByUserId(req.user.id, 1000, 0).then(p => p.length);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalCount / limit),
          total_count: totalCount,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get current subscription
// @route   GET /api/payments/subscription
// @access  Private
router.get('/subscription', protect, async (req, res, next) => {
  try {
    const activeSubscription = await Payment.getActiveSubscription(req.user.id);

    res.json({
      success: true,
      data: {
        subscription: activeSubscription,
        current_tier: req.user.subscription_tier,
        expires_at: req.user.subscription_expires_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Cancel subscription
// @route   POST /api/payments/cancel-subscription
// @access  Private
router.post('/cancel-subscription', protect, async (req, res, next) => {
  try {
    const result = await PaymentService.cancelSubscription(req.user.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    logger.info(`Subscription cancelled by user: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get payment statistics (admin only)
// @route   GET /api/payments/stats
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res, next) => {
  try {
    const stats = await Payment.getPaymentStats();
    
    const currentDate = new Date();
    const monthlyRevenue = await Payment.getMonthlyRevenue(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1
    );

    res.json({
      success: true,
      data: {
        payment_stats: stats,
        monthly_revenue: monthlyRevenue
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
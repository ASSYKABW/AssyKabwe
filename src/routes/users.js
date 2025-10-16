const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user stats (admin only)
// @route   GET /api/users/stats
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res, next) => {
  try {
    const stats = await User.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user usage stats
// @route   GET /api/users/usage
// @access  Private
router.get('/usage', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    const usage = {
      cv_rewrites_used: user.cv_rewrites_used,
      interview_sessions_used: user.interview_sessions_used,
      linkedin_optimizations_used: user.linkedin_optimizations_used,
      subscription_tier: user.subscription_tier,
      subscription_expires_at: user.subscription_expires_at
    };

    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
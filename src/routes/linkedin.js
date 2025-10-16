const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, requireSubscription } = require('../middleware/auth');
const LinkedInProfile = require('../models/LinkedInProfile');
const User = require('../models/User');
const AIService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get user's LinkedIn profiles
// @route   GET /api/linkedin
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const profiles = await LinkedInProfile.findAllByUserId(req.user.id, parseInt(limit), offset);
    const totalCount = await LinkedInProfile.getUserProfileCount(req.user.id);
    const latestOptimization = await LinkedInProfile.getLatestOptimization(req.user.id);

    res.json({
      success: true,
      data: {
        profiles,
        latest_optimization: latestOptimization,
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

// @desc    Get single LinkedIn profile
// @route   GET /api/linkedin/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const profile = await LinkedInProfile.findById(req.params.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'LinkedIn profile not found'
      });
    }

    if (profile.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this profile'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Optimize LinkedIn profile
// @route   POST /api/linkedin/optimize
// @access  Private
router.post('/optimize', protect, [
  body('headline').optional().trim(),
  body('summary').optional().trim(),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('target_role').notEmpty().withMessage('Target role is required'),
  body('target_industry').optional().trim(),
  body('linkedin_url').optional().isURL().withMessage('Please provide a valid LinkedIn URL')
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

    // Check usage limits
    const canUse = await User.checkUsageLimit(req.user, 'linkedin_optimizations');
    if (!canUse) {
      return res.status(403).json({
        success: false,
        error: 'LinkedIn optimization limit reached for your subscription tier'
      });
    }

    const { headline, summary, skills, target_role, target_industry, linkedin_url } = req.body;

    // Create profile record
    const profileData = {
      user_id: req.user.id,
      linkedin_url,
      original_headline: headline,
      original_summary: summary,
      original_skills: skills,
      status: 'processing'
    };

    const profile = await LinkedInProfile.create(profileData);

    // Prepare current profile data for AI
    const currentProfile = {
      headline: headline || '',
      summary: summary || '',
      skills: skills || []
    };

    // Call AI service
    const aiResult = await AIService.optimizeLinkedInProfile(
      currentProfile,
      target_role,
      target_industry
    );

    if (!aiResult.success) {
      await LinkedInProfile.update(profile.id, { status: 'failed' });
      return res.status(500).json({
        success: false,
        error: aiResult.error
      });
    }

    // Update profile with AI results
    const updatedProfile = await LinkedInProfile.update(profile.id, {
      optimized_headline: aiResult.data.optimized_headline,
      optimized_summary: aiResult.data.optimized_summary,
      optimized_skills: aiResult.data.recommended_skills,
      keyword_suggestions: aiResult.data.keywords,
      profile_strength_before: aiResult.data.profile_strength_before,
      profile_strength_after: aiResult.data.profile_strength_after,
      ai_recommendations: {
        improvements: aiResult.data.improvements
      },
      status: 'completed'
    });

    // Increment user usage
    await User.incrementUsage(req.user.id, 'linkedin_optimizations_used');

    logger.info(`LinkedIn profile optimized for user: ${req.user.id}, role: ${target_role}`);

    res.status(201).json({
      success: true,
      data: updatedProfile
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Mark LinkedIn profile as applied
// @route   PUT /api/linkedin/:id/apply
// @access  Private
router.put('/:id/apply', protect, async (req, res, next) => {
  try {
    const profile = await LinkedInProfile.findById(req.params.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'LinkedIn profile not found'
      });
    }

    if (profile.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this profile'
      });
    }

    const updatedProfile = await LinkedInProfile.update(profile.id, {
      applied_to_linkedin: true
    });

    res.json({
      success: true,
      data: updatedProfile
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete LinkedIn profile optimization
// @route   DELETE /api/linkedin/:id
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const profile = await LinkedInProfile.findById(req.params.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'LinkedIn profile not found'
      });
    }

    if (profile.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this profile'
      });
    }

    await LinkedInProfile.delete(profile.id);

    logger.info(`LinkedIn profile deleted: ${profile.id} by user: ${req.user.id}`);

    res.json({
      success: true,
      message: 'LinkedIn profile optimization deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
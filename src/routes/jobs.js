const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const AIService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get jobs with filtering and search
// @route   GET /api/jobs
// @access  Private
router.get('/', protect, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('search').optional().trim(),
  query('location').optional().trim(),
  query('experience_level').optional().isIn(['entry', 'junior', 'mid', 'senior', 'executive']),
  query('employment_type').optional().isIn(['full_time', 'part_time', 'contract', 'internship'])
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

    const {
      page = 1,
      limit = 20,
      search,
      location,
      experience_level,
      employment_type
    } = req.query;

    const offset = (page - 1) * limit;
    const filters = { is_active: true };

    if (location) filters.location = location;
    if (experience_level) filters.experience_level = experience_level;
    if (employment_type) filters.employment_type = employment_type;

    const jobs = await Job.findWithFilters(filters, search, parseInt(limit), offset);
    const totalCount = await Job.countWithFilters(filters, search);

    res.json({
      success: true,
      data: {
        jobs,
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

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check if user has already applied
    const application = await JobApplication.findByUserAndJob(req.user.id, job.id);

    res.json({
      success: true,
      data: {
        ...job,
        user_application: application
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get job match analysis
// @route   POST /api/jobs/:id/match
// @access  Private
router.post('/:id/match', protect, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Get user's latest CV
    const CV = require('../models/CV');
    const latestCV = await CV.findByUserId(req.user.id, 1, 0);
    const cvContent = latestCV[0]?.rewritten_content || latestCV[0]?.original_content || '';

    // Call AI service for job matching
    const matchResult = await AIService.matchJobToProfile(
      job.description,
      req.user.profile_data || {},
      cvContent
    );

    if (!matchResult.success) {
      return res.status(500).json({
        success: false,
        error: matchResult.error
      });
    }

    res.json({
      success: true,
      data: matchResult.data
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Apply to job
// @route   POST /api/jobs/:id/apply
// @access  Private
router.post('/:id/apply', protect, [
  body('cv_id').optional().isUUID().withMessage('CV ID must be a valid UUID'),
  body('cover_letter').optional().trim(),
  body('notes').optional().trim()
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

    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check if user has already applied
    const existingApplication = await JobApplication.findByUserAndJob(req.user.id, job.id);
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: 'You have already applied to this job'
      });
    }

    const { cv_id, cover_letter, notes } = req.body;

    // Verify CV belongs to user if provided
    if (cv_id) {
      const CV = require('../models/CV');
      const cv = await CV.findById(cv_id);
      if (!cv || cv.user_id !== req.user.id) {
        return res.status(400).json({
          success: false,
          error: 'Invalid CV selected'
        });
      }
    }

    const applicationData = {
      user_id: req.user.id,
      job_id: job.id,
      cv_id,
      cover_letter,
      notes,
      status: 'applied',
      applied_at: new Date()
    };

    const application = await JobApplication.create(applicationData);

    logger.info(`Job application created: User ${req.user.id} applied to job ${job.id}`);

    res.status(201).json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user's job applications
// @route   GET /api/jobs/applications
// @access  Private
router.get('/applications', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const applications = await JobApplication.findByUserId(
      req.user.id,
      status,
      parseInt(limit),
      offset
    );
    const totalCount = await JobApplication.getUserApplicationCount(req.user.id, status);

    res.json({
      success: true,
      data: {
        applications,
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

// @desc    Update job application status
// @route   PUT /api/jobs/applications/:id
// @access  Private
router.put('/applications/:id', protect, [
  body('status').isIn(['saved', 'applied', 'interview_scheduled', 'interview_completed', 'offer_received', 'rejected', 'withdrawn']).withMessage('Invalid status'),
  body('notes').optional().trim()
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

    const application = await JobApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Job application not found'
      });
    }

    if (application.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this application'
      });
    }

    const { status, notes } = req.body;
    const updates = { status, last_updated_at: new Date() };
    if (notes !== undefined) updates.notes = notes;

    const updatedApplication = await JobApplication.update(application.id, updates);

    res.json({
      success: true,
      data: updatedApplication
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create job (recruiters only)
// @route   POST /api/jobs
// @access  Private/Recruiter
router.post('/', protect, authorize('recruiter', 'admin'), [
  body('title').notEmpty().withMessage('Job title is required'),
  body('company').notEmpty().withMessage('Company name is required'),
  body('description').notEmpty().withMessage('Job description is required'),
  body('location').optional().trim(),
  body('salary_range').optional().trim(),
  body('employment_type').isIn(['full_time', 'part_time', 'contract', 'internship']).withMessage('Invalid employment type'),
  body('experience_level').isIn(['entry', 'junior', 'mid', 'senior', 'executive']).withMessage('Invalid experience level'),
  body('required_skills').optional().isArray().withMessage('Required skills must be an array'),
  body('preferred_skills').optional().isArray().withMessage('Preferred skills must be an array')
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

    const jobData = {
      ...req.body,
      posted_at: new Date(),
      is_active: true
    };

    const job = await Job.create(jobData);

    logger.info(`Job created by recruiter: ${req.user.id}, job: ${job.id}`);

    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
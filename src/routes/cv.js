const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { protect, requireSubscription } = require('../middleware/auth');
const CV = require('../models/CV');
const User = require('../models/User');
const AIService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `cv-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// @desc    Get user's CVs
// @route   GET /api/cv
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const cvs = await CV.findByUserId(req.user.id, parseInt(limit), offset);
    const totalCount = await CV.getUserCVCount(req.user.id);

    res.json({
      success: true,
      data: {
        cvs,
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

// @desc    Get single CV
// @route   GET /api/cv/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const cv = await CV.findById(req.params.id);
    
    if (!cv) {
      return res.status(404).json({
        success: false,
        error: 'CV not found'
      });
    }

    // Check if user owns this CV
    if (cv.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this CV'
      });
    }

    res.json({
      success: true,
      data: cv
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create/Upload CV
// @route   POST /api/cv/upload
// @access  Private
router.post('/upload', protect, upload.single('cv'), async (req, res, next) => {
  try {
    const { title, target_role, target_industry } = req.body;

    if (!req.file && !req.body.content) {
      return res.status(400).json({
        success: false,
        error: 'Please provide either a file or CV content'
      });
    }

    const cvData = {
      user_id: req.user.id,
      title: title || 'My CV',
      target_role,
      target_industry,
      original_content: req.body.content,
      status: 'draft'
    };

    if (req.file) {
      cvData.file_path = req.file.path;
      cvData.file_type = req.file.mimetype;
      cvData.file_size = req.file.size;
    }

    const cv = await CV.create(cvData);

    logger.info(`CV uploaded by user: ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: cv
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Rewrite CV with AI
// @route   POST /api/cv/:id/rewrite
// @access  Private
router.post('/:id/rewrite', protect, [
  body('target_role').notEmpty().withMessage('Target role is required'),
  body('target_industry').optional().trim()
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
    const canUse = await User.checkUsageLimit(req.user, 'cv_rewrites');
    if (!canUse) {
      return res.status(403).json({
        success: false,
        error: 'CV rewrite limit reached for your subscription tier'
      });
    }

    const cv = await CV.findById(req.params.id);
    
    if (!cv) {
      return res.status(404).json({
        success: false,
        error: 'CV not found'
      });
    }

    if (cv.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this CV'
      });
    }

    if (!cv.original_content) {
      return res.status(400).json({
        success: false,
        error: 'No CV content available for rewriting'
      });
    }

    // Update CV status to processing
    await CV.update(cv.id, { status: 'processing' });

    const { target_role, target_industry } = req.body;

    // Call AI service
    const aiResult = await AIService.rewriteCV(
      cv.original_content,
      target_role,
      target_industry,
      req.user.profile_data
    );

    if (!aiResult.success) {
      await CV.update(cv.id, { status: 'failed' });
      return res.status(500).json({
        success: false,
        error: aiResult.error
      });
    }

    // Update CV with AI results
    const updatedCV = await CV.update(cv.id, {
      rewritten_content: aiResult.data.rewritten_cv,
      target_role,
      target_industry,
      keywords_added: aiResult.data.keywords_added,
      original_score: aiResult.data.original_score,
      improved_score: aiResult.data.improved_score,
      ai_feedback: {
        improvements: aiResult.data.improvements,
        recommendations: aiResult.data.recommendations
      },
      status: 'completed'
    });

    // Increment user usage
    await User.incrementUsage(req.user.id, 'cv_rewrites_used');

    logger.info(`CV rewritten for user: ${req.user.id}, CV: ${cv.id}`);

    res.json({
      success: true,
      data: updatedCV
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Toggle CV favorite status
// @route   PUT /api/cv/:id/favorite
// @access  Private
router.put('/:id/favorite', protect, async (req, res, next) => {
  try {
    const cv = await CV.findById(req.params.id);
    
    if (!cv) {
      return res.status(404).json({
        success: false,
        error: 'CV not found'
      });
    }

    if (cv.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this CV'
      });
    }

    const { is_favorite } = req.body;
    const updatedCV = await CV.markAsFavorite(cv.id, is_favorite);

    res.json({
      success: true,
      data: updatedCV
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete CV
// @route   DELETE /api/cv/:id
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const cv = await CV.findById(req.params.id);
    
    if (!cv) {
      return res.status(404).json({
        success: false,
        error: 'CV not found'
      });
    }

    if (cv.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this CV'
      });
    }

    await CV.delete(cv.id);

    // TODO: Delete associated file if exists
    // if (cv.file_path) {
    //   fs.unlink(cv.file_path, (err) => {
    //     if (err) logger.error('Failed to delete CV file:', err);
    //   });
    // }

    logger.info(`CV deleted: ${cv.id} by user: ${req.user.id}`);

    res.json({
      success: true,
      message: 'CV deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user's favorite CVs
// @route   GET /api/cv/favorites
// @access  Private
router.get('/favorites', protect, async (req, res, next) => {
  try {
    const favorites = await CV.getFavorites(req.user.id);

    res.json({
      success: true,
      data: favorites
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
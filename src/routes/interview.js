const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, requireSubscription } = require('../middleware/auth');
const Interview = require('../models/Interview');
const User = require('../models/User');
const AIService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get user's interviews
// @route   GET /api/interview
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const interviews = await Interview.findByUserId(req.user.id, parseInt(limit), offset);
    const totalCount = await Interview.getUserInterviewCount(req.user.id);
    const stats = await Interview.getInterviewStats(req.user.id);

    res.json({
      success: true,
      data: {
        interviews,
        stats,
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

// @desc    Get single interview
// @route   GET /api/interview/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    if (interview.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this interview'
      });
    }

    res.json({
      success: true,
      data: interview
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new interview session
// @route   POST /api/interview
// @access  Private
router.post('/', protect, [
  body('job_role').notEmpty().withMessage('Job role is required'),
  body('experience_level').isIn(['entry', 'junior', 'mid', 'senior', 'executive']).withMessage('Invalid experience level'),
  body('interview_type').optional().isIn(['behavioral', 'technical', 'case_study', 'mixed']).withMessage('Invalid interview type'),
  body('company_name').optional().trim()
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
    const canUse = await User.checkUsageLimit(req.user, 'interview_sessions');
    if (!canUse) {
      return res.status(403).json({
        success: false,
        error: 'Interview session limit reached for your subscription tier'
      });
    }

    const { job_role, experience_level, interview_type, company_name } = req.body;

    // Generate interview questions using AI
    const questionsResult = await AIService.generateInterviewQuestions(
      job_role,
      experience_level,
      interview_type || 'mixed',
      company_name
    );

    if (!questionsResult.success) {
      return res.status(500).json({
        success: false,
        error: questionsResult.error
      });
    }

    const interviewData = {
      user_id: req.user.id,
      job_role,
      company_name,
      experience_level,
      interview_type: interview_type || 'mixed',
      questions: questionsResult.data.questions,
      status: 'scheduled'
    };

    const interview = await Interview.create(interviewData);

    logger.info(`Interview session created for user: ${req.user.id}, role: ${job_role}`);

    res.status(201).json({
      success: true,
      data: interview
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Start interview session
// @route   POST /api/interview/:id/start
// @access  Private
router.post('/:id/start', protect, async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    if (interview.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this interview'
      });
    }

    if (interview.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        error: 'Interview cannot be started in current status'
      });
    }

    const updatedInterview = await Interview.startInterview(interview.id);

    res.json({
      success: true,
      data: updatedInterview
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Submit answer to interview question
// @route   POST /api/interview/:id/answer
// @access  Private
router.post('/:id/answer', protect, [
  body('question_index').isInt({ min: 0 }).withMessage('Valid question index is required'),
  body('answer').notEmpty().withMessage('Answer is required')
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

    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    if (interview.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this interview'
      });
    }

    if (interview.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        error: 'Interview is not in progress'
      });
    }

    const { question_index, answer } = req.body;
    const questions = interview.questions || [];

    if (question_index >= questions.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid question index'
      });
    }

    const question = questions[question_index];

    // Evaluate answer using AI
    const evaluationResult = await AIService.evaluateInterviewAnswer(
      question.question,
      answer,
      interview.job_role,
      interview.experience_level
    );

    if (!evaluationResult.success) {
      return res.status(500).json({
        success: false,
        error: evaluationResult.error
      });
    }

    // Update question with answer and feedback
    questions[question_index] = {
      ...question,
      user_answer: answer,
      feedback: evaluationResult.data,
      answered_at: new Date()
    };

    await Interview.update(interview.id, { questions });

    res.json({
      success: true,
      data: {
        feedback: evaluationResult.data,
        question_index,
        total_questions: questions.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Complete interview session
// @route   POST /api/interview/:id/complete
// @access  Private
router.post('/:id/complete', protect, async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    if (interview.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this interview'
      });
    }

    if (interview.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        error: 'Interview is not in progress'
      });
    }

    // Calculate overall score and duration
    const questions = interview.questions || [];
    const answeredQuestions = questions.filter(q => q.user_answer);
    
    if (answeredQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No questions were answered'
      });
    }

    const totalScore = answeredQuestions.reduce((sum, q) => sum + (q.feedback?.score || 0), 0);
    const overallScore = Math.round(totalScore / answeredQuestions.length);
    
    const startTime = new Date(interview.started_at);
    const endTime = new Date();
    const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

    // Generate improvement suggestions
    const lowScoreQuestions = answeredQuestions.filter(q => (q.feedback?.score || 0) < 70);
    const improvementSuggestions = lowScoreQuestions
      .flatMap(q => q.feedback?.suggestions || [])
      .slice(0, 5); // Top 5 suggestions

    const completionData = {
      overall_score: overallScore,
      duration_minutes: durationMinutes,
      improvement_suggestions: improvementSuggestions.join('\n'),
      performance_metrics: {
        questions_answered: answeredQuestions.length,
        total_questions: questions.length,
        average_score: overallScore,
        completion_rate: Math.round((answeredQuestions.length / questions.length) * 100)
      }
    };

    const completedInterview = await Interview.completeInterview(interview.id, completionData);

    // Increment user usage
    await User.incrementUsage(req.user.id, 'interview_sessions_used');

    logger.info(`Interview completed for user: ${req.user.id}, score: ${overallScore}`);

    res.json({
      success: true,
      data: completedInterview
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete interview
// @route   DELETE /api/interview/:id
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    if (interview.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this interview'
      });
    }

    await Interview.delete(interview.id);

    logger.info(`Interview deleted: ${interview.id} by user: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Interview deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
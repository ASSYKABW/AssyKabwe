const OpenAI = require('openai');
const logger = require('../utils/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class AIService {
  static async rewriteCV(cvContent, targetRole, targetIndustry, userProfile) {
    try {
      const prompt = `
You are an expert CV writer and career coach. Please rewrite the following CV to optimize it for the target role and industry.

TARGET ROLE: ${targetRole}
TARGET INDUSTRY: ${targetIndustry || 'General'}
USER EXPERIENCE LEVEL: ${userProfile?.experience_level || 'Mid-level'}

ORIGINAL CV:
${cvContent}

Please provide:
1. A rewritten CV with improved formatting and content
2. Key improvements made
3. ATS-friendly keywords added
4. A score improvement estimate (original vs improved)
5. Specific recommendations for further improvement

Format your response as JSON with the following structure:
{
  "rewritten_cv": "...",
  "improvements": ["improvement1", "improvement2", ...],
  "keywords_added": ["keyword1", "keyword2", ...],
  "original_score": 65,
  "improved_score": 89,
  "recommendations": ["rec1", "rec2", ...]
}
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert CV writer and ATS optimization specialist. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const response = JSON.parse(completion.choices[0].message.content);
      
      logger.info(`CV rewrite completed for role: ${targetRole}`);
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      logger.error('CV rewrite error:', error);
      return {
        success: false,
        error: 'Failed to rewrite CV. Please try again.'
      };
    }
  }

  static async generateInterviewQuestions(jobRole, experienceLevel, interviewType, companyName) {
    try {
      const prompt = `
Generate interview questions for the following position:

JOB ROLE: ${jobRole}
EXPERIENCE LEVEL: ${experienceLevel}
INTERVIEW TYPE: ${interviewType}
COMPANY: ${companyName || 'Generic Company'}

Please generate 8-10 relevant interview questions with:
1. The question text
2. What the interviewer is looking for
3. A sample strong answer structure
4. Key points to include

Format as JSON:
{
  "questions": [
    {
      "question": "...",
      "purpose": "...",
      "answer_structure": "...",
      "key_points": ["point1", "point2", ...]
    }
  ]
}
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert interviewer and career coach. Generate relevant, challenging interview questions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1500
      });

      const response = JSON.parse(completion.choices[0].message.content);
      
      logger.info(`Interview questions generated for role: ${jobRole}`);
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      logger.error('Interview questions generation error:', error);
      return {
        success: false,
        error: 'Failed to generate interview questions. Please try again.'
      };
    }
  }

  static async evaluateInterviewAnswer(question, answer, jobRole, experienceLevel) {
    try {
      const prompt = `
Evaluate this interview answer:

QUESTION: ${question}
ANSWER: ${answer}
JOB ROLE: ${jobRole}
EXPERIENCE LEVEL: ${experienceLevel}

Please provide:
1. Overall score (0-100)
2. Strengths of the answer
3. Areas for improvement
4. Specific suggestions
5. A better version of the answer

Format as JSON:
{
  "score": 85,
  "strengths": ["strength1", "strength2", ...],
  "improvements": ["improvement1", "improvement2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "better_answer": "..."
}
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert interview coach. Provide constructive, specific feedback."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 1000
      });

      const response = JSON.parse(completion.choices[0].message.content);
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      logger.error('Interview answer evaluation error:', error);
      return {
        success: false,
        error: 'Failed to evaluate answer. Please try again.'
      };
    }
  }

  static async optimizeLinkedInProfile(currentProfile, targetRole, targetIndustry) {
    try {
      const prompt = `
Optimize this LinkedIn profile for better recruiter visibility:

TARGET ROLE: ${targetRole}
TARGET INDUSTRY: ${targetIndustry || 'General'}

CURRENT PROFILE:
Headline: ${currentProfile.headline || ''}
Summary: ${currentProfile.summary || ''}
Skills: ${currentProfile.skills ? currentProfile.skills.join(', ') : ''}

Please provide:
1. Optimized headline
2. Optimized summary/about section
3. Recommended skills to add/remove
4. Keywords for better discoverability
5. Profile strength improvement estimate

Format as JSON:
{
  "optimized_headline": "...",
  "optimized_summary": "...",
  "recommended_skills": ["skill1", "skill2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "profile_strength_before": 65,
  "profile_strength_after": 88,
  "improvements": ["improvement1", "improvement2", ...]
}
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a LinkedIn optimization expert and recruiter. Focus on visibility and professional appeal."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const response = JSON.parse(completion.choices[0].message.content);
      
      logger.info(`LinkedIn profile optimized for role: ${targetRole}`);
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      logger.error('LinkedIn optimization error:', error);
      return {
        success: false,
        error: 'Failed to optimize LinkedIn profile. Please try again.'
      };
    }
  }

  static async matchJobToProfile(jobDescription, userProfile, userCV) {
    try {
      const prompt = `
Calculate how well this user matches the job:

JOB DESCRIPTION:
${jobDescription}

USER PROFILE:
Experience Level: ${userProfile.experience_level || 'Not specified'}
Skills: ${userProfile.skills ? userProfile.skills.join(', ') : 'Not specified'}
Industry: ${userProfile.industry || 'Not specified'}

USER CV SUMMARY:
${userCV || 'No CV provided'}

Please provide:
1. Match percentage (0-100)
2. Matching skills/qualifications
3. Missing skills/qualifications
4. Recommendations to improve match
5. Application priority (High/Medium/Low)

Format as JSON:
{
  "match_percentage": 78,
  "matching_skills": ["skill1", "skill2", ...],
  "missing_skills": ["skill1", "skill2", ...],
  "recommendations": ["rec1", "rec2", ...],
  "priority": "High",
  "reasoning": "..."
}
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert recruiter and job matching specialist. Provide accurate, helpful matching analysis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 1000
      });

      const response = JSON.parse(completion.choices[0].message.content);
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      logger.error('Job matching error:', error);
      return {
        success: false,
        error: 'Failed to analyze job match. Please try again.'
      };
    }
  }
}

module.exports = AIService;
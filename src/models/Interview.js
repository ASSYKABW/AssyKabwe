const knex = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

class Interview {
  static async create(interviewData) {
    const interview = {
      id: uuidv4(),
      ...interviewData,
      created_at: new Date(),
      updated_at: new Date()
    };

    const [createdInterview] = await knex('interviews').insert(interview).returning('*');
    return createdInterview;
  }

  static async findById(id) {
    return await knex('interviews').where({ id }).first();
  }

  static async findByUserId(userId, limit = 10, offset = 0) {
    return await knex('interviews')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  static async update(id, updates) {
    const [updatedInterview] = await knex('interviews')
      .where({ id })
      .update({
        ...updates,
        updated_at: new Date()
      })
      .returning('*');
    
    return updatedInterview;
  }

  static async delete(id) {
    return await knex('interviews').where({ id }).del();
  }

  static async getUserInterviewCount(userId) {
    const result = await knex('interviews')
      .where({ user_id: userId })
      .count('* as count')
      .first();
    
    return parseInt(result.count);
  }

  static async getRecentInterviews(userId, limit = 5) {
    return await knex('interviews')
      .where({ user_id: userId })
      .orderBy('updated_at', 'desc')
      .limit(limit)
      .select('id', 'job_role', 'company_name', 'overall_score', 'status', 'updated_at');
  }

  static async getInterviewStats(userId) {
    const stats = await knex('interviews')
      .where({ user_id: userId, status: 'completed' })
      .select(
        knex.raw('AVG(overall_score) as average_score'),
        knex.raw('COUNT(*) as total_completed'),
        knex.raw('AVG(duration_minutes) as average_duration')
      )
      .first();

    return {
      average_score: Math.round(stats.average_score || 0),
      total_completed: parseInt(stats.total_completed || 0),
      average_duration: Math.round(stats.average_duration || 0)
    };
  }

  static async startInterview(id) {
    return await this.update(id, {
      status: 'in_progress',
      started_at: new Date()
    });
  }

  static async completeInterview(id, completionData) {
    return await this.update(id, {
      ...completionData,
      status: 'completed',
      completed_at: new Date()
    });
  }
}

module.exports = Interview;
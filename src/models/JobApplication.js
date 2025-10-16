const knex = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

class JobApplication {
  static async create(applicationData) {
    const application = {
      id: uuidv4(),
      ...applicationData,
      created_at: new Date(),
      updated_at: new Date()
    };

    const [createdApplication] = await knex('job_applications').insert(application).returning('*');
    return createdApplication;
  }

  static async findById(id) {
    return await knex('job_applications')
      .select(
        'job_applications.*',
        'jobs.title as job_title',
        'jobs.company as job_company',
        'jobs.location as job_location'
      )
      .leftJoin('jobs', 'job_applications.job_id', 'jobs.id')
      .where('job_applications.id', id)
      .first();
  }

  static async findByUserAndJob(userId, jobId) {
    return await knex('job_applications')
      .where({ user_id: userId, job_id: jobId })
      .first();
  }

  static async findByUserId(userId, status = null, limit = 20, offset = 0) {
    let query = knex('job_applications')
      .select(
        'job_applications.*',
        'jobs.title as job_title',
        'jobs.company as job_company',
        'jobs.location as job_location',
        'jobs.salary_range as job_salary_range'
      )
      .leftJoin('jobs', 'job_applications.job_id', 'jobs.id')
      .where('job_applications.user_id', userId);

    if (status) {
      query = query.where('job_applications.status', status);
    }

    return await query
      .orderBy('job_applications.updated_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  static async update(id, updates) {
    const [updatedApplication] = await knex('job_applications')
      .where({ id })
      .update({
        ...updates,
        updated_at: new Date()
      })
      .returning('*');
    
    return updatedApplication;
  }

  static async delete(id) {
    return await knex('job_applications').where({ id }).del();
  }

  static async getUserApplicationCount(userId, status = null) {
    let query = knex('job_applications').where({ user_id: userId });
    
    if (status) {
      query = query.where({ status });
    }

    const result = await query.count('* as count').first();
    return parseInt(result.count);
  }

  static async getApplicationStats(userId) {
    const stats = await knex('job_applications')
      .select('status')
      .count('* as count')
      .where({ user_id: userId })
      .groupBy('status');

    const statusCounts = {};
    stats.forEach(stat => {
      statusCounts[stat.status] = parseInt(stat.count);
    });

    return {
      total: stats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
      by_status: statusCounts
    };
  }

  static async getRecentApplications(userId, limit = 5) {
    return await knex('job_applications')
      .select(
        'job_applications.id',
        'job_applications.status',
        'job_applications.applied_at',
        'jobs.title as job_title',
        'jobs.company as job_company'
      )
      .leftJoin('jobs', 'job_applications.job_id', 'jobs.id')
      .where('job_applications.user_id', userId)
      .orderBy('job_applications.updated_at', 'desc')
      .limit(limit);
  }

  static async updateMatchScore(id, matchScore, matchAnalysis) {
    return await this.update(id, {
      match_score: matchScore,
      match_analysis: matchAnalysis
    });
  }
}

module.exports = JobApplication;
const knex = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

class Job {
  static async create(jobData) {
    const job = {
      id: uuidv4(),
      ...jobData,
      created_at: new Date(),
      updated_at: new Date()
    };

    const [createdJob] = await knex('jobs').insert(job).returning('*');
    return createdJob;
  }

  static async findById(id) {
    return await knex('jobs').where({ id }).first();
  }

  static async findWithFilters(filters = {}, search = '', limit = 20, offset = 0) {
    let query = knex('jobs').where(filters);

    if (search) {
      query = query.where(function() {
        this.where('title', 'like', `%${search}%`)
            .orWhere('company', 'like', `%${search}%`)
            .orWhere('description', 'like', `%${search}%`);
      });
    }

    return await query
      .orderBy('posted_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  static async countWithFilters(filters = {}, search = '') {
    let query = knex('jobs').where(filters);

    if (search) {
      query = query.where(function() {
        this.where('title', 'like', `%${search}%`)
            .orWhere('company', 'like', `%${search}%`)
            .orWhere('description', 'like', `%${search}%`);
      });
    }

    const result = await query.count('* as count').first();
    return parseInt(result.count);
  }

  static async update(id, updates) {
    const [updatedJob] = await knex('jobs')
      .where({ id })
      .update({
        ...updates,
        updated_at: new Date()
      })
      .returning('*');
    
    return updatedJob;
  }

  static async delete(id) {
    return await knex('jobs').where({ id }).del();
  }

  static async deactivate(id) {
    return await this.update(id, { is_active: false });
  }

  static async getRecentJobs(limit = 10) {
    return await knex('jobs')
      .where({ is_active: true })
      .orderBy('posted_at', 'desc')
      .limit(limit);
  }

  static async getJobsByCompany(company, limit = 10) {
    return await knex('jobs')
      .where({ company, is_active: true })
      .orderBy('posted_at', 'desc')
      .limit(limit);
  }

  static async getJobStats() {
    const stats = await knex('jobs')
      .select('experience_level', 'employment_type')
      .count('* as count')
      .where({ is_active: true })
      .groupBy('experience_level', 'employment_type');
    
    return stats;
  }
}

module.exports = Job;
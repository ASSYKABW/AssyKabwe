const knex = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

class LinkedInProfile {
  static async create(profileData) {
    const profile = {
      id: uuidv4(),
      ...profileData,
      created_at: new Date(),
      updated_at: new Date()
    };

    const [createdProfile] = await knex('linkedin_profiles').insert(profile).returning('*');
    return createdProfile;
  }

  static async findById(id) {
    return await knex('linkedin_profiles').where({ id }).first();
  }

  static async findByUserId(userId) {
    return await knex('linkedin_profiles')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .first();
  }

  static async findAllByUserId(userId, limit = 10, offset = 0) {
    return await knex('linkedin_profiles')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  static async update(id, updates) {
    const [updatedProfile] = await knex('linkedin_profiles')
      .where({ id })
      .update({
        ...updates,
        updated_at: new Date()
      })
      .returning('*');
    
    return updatedProfile;
  }

  static async delete(id) {
    return await knex('linkedin_profiles').where({ id }).del();
  }

  static async getUserProfileCount(userId) {
    const result = await knex('linkedin_profiles')
      .where({ user_id: userId })
      .count('* as count')
      .first();
    
    return parseInt(result.count);
  }

  static async getLatestOptimization(userId) {
    return await knex('linkedin_profiles')
      .where({ user_id: userId, status: 'completed' })
      .orderBy('updated_at', 'desc')
      .first();
  }
}

module.exports = LinkedInProfile;
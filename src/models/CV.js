const knex = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

class CV {
  static async create(cvData) {
    const cv = {
      id: uuidv4(),
      ...cvData,
      created_at: new Date(),
      updated_at: new Date()
    };

    const [createdCV] = await knex('cvs').insert(cv).returning('*');
    return createdCV;
  }

  static async findById(id) {
    return await knex('cvs').where({ id }).first();
  }

  static async findByUserId(userId, limit = 10, offset = 0) {
    return await knex('cvs')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  static async update(id, updates) {
    const [updatedCV] = await knex('cvs')
      .where({ id })
      .update({
        ...updates,
        updated_at: new Date()
      })
      .returning('*');
    
    return updatedCV;
  }

  static async delete(id) {
    return await knex('cvs').where({ id }).del();
  }

  static async getUserCVCount(userId) {
    const result = await knex('cvs')
      .where({ user_id: userId })
      .count('* as count')
      .first();
    
    return parseInt(result.count);
  }

  static async getRecentCVs(userId, limit = 5) {
    return await knex('cvs')
      .where({ user_id: userId })
      .orderBy('updated_at', 'desc')
      .limit(limit)
      .select('id', 'title', 'target_role', 'improved_score', 'status', 'updated_at');
  }

  static async markAsFavorite(id, isFavorite = true) {
    return await this.update(id, { is_favorite: isFavorite });
  }

  static async getFavorites(userId) {
    return await knex('cvs')
      .where({ user_id: userId, is_favorite: true })
      .orderBy('updated_at', 'desc');
  }
}

module.exports = CV;
const knex = require('../database/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class User {
  static async create(userData) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    
    const user = {
      id: uuidv4(),
      full_name: userData.full_name,
      email: userData.email.toLowerCase(),
      password_hash: hashedPassword,
      role: userData.role || 'seeker',
      subscription_tier: userData.subscription_tier || 'basic',
      email_verified: false,
      verification_token: uuidv4(),
      created_at: new Date(),
      updated_at: new Date()
    };

    const [createdUser] = await knex('users').insert(user).returning('*');
    return this.sanitizeUser(createdUser);
  }

  static async findById(id) {
    const user = await knex('users').where({ id }).first();
    return user ? this.sanitizeUser(user) : null;
  }

  static async findByEmail(email) {
    const user = await knex('users').where({ email: email.toLowerCase() }).first();
    return user ? this.sanitizeUser(user) : null;
  }

  static async findByEmailWithPassword(email) {
    return await knex('users').where({ email: email.toLowerCase() }).first();
  }

  static async update(id, updates) {
    const updatedUser = await knex('users')
      .where({ id })
      .update({
        ...updates,
        updated_at: new Date()
      })
      .returning('*');
    
    return updatedUser[0] ? this.sanitizeUser(updatedUser[0]) : null;
  }

  static async delete(id) {
    return await knex('users').where({ id }).del();
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static generateToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  static async updateLastLogin(id) {
    await knex('users')
      .where({ id })
      .update({ 
        last_login_at: new Date(),
        updated_at: new Date()
      });
  }

  static async incrementUsage(id, field) {
    await knex('users')
      .where({ id })
      .increment(field, 1)
      .update({ updated_at: new Date() });
  }

  static async checkUsageLimit(user, service) {
    const limits = {
      basic: {
        cv_rewrites_used: 1,
        interview_sessions_used: 3,
        linkedin_optimizations_used: 1
      },
      pro: {
        cv_rewrites_used: Infinity,
        interview_sessions_used: Infinity,
        linkedin_optimizations_used: Infinity
      },
      executive: {
        cv_rewrites_used: Infinity,
        interview_sessions_used: Infinity,
        linkedin_optimizations_used: Infinity
      },
      corporate: {
        cv_rewrites_used: Infinity,
        interview_sessions_used: Infinity,
        linkedin_optimizations_used: Infinity
      }
    };

    const userLimits = limits[user.subscription_tier];
    const usageField = `${service}_used`;
    
    return user[usageField] < userLimits[usageField];
  }

  static sanitizeUser(user) {
    if (!user) return null;
    
    const { password_hash, verification_token, reset_password_token, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  static async getStats() {
    const stats = await knex('users')
      .select('role', 'subscription_tier')
      .count('* as count')
      .groupBy('role', 'subscription_tier');
    
    return stats;
  }
}

module.exports = User;
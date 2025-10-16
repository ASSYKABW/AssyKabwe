const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash('demo123', saltRounds);

  // Inserts seed entries
  await knex('users').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      full_name: 'John Seeker',
      email: 'john@example.com',
      password_hash: hashedPassword,
      role: 'seeker',
      subscription_tier: 'pro',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      full_name: 'Sarah Recruiter',
      email: 'sarah@company.com',
      password_hash: hashedPassword,
      role: 'recruiter',
      subscription_tier: 'corporate',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      full_name: 'Admin User',
      email: 'admin@careerboost.com',
      password_hash: hashedPassword,
      role: 'admin',
      subscription_tier: 'corporate',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};
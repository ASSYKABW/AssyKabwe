exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('jobs').del();
  
  // Inserts seed entries
  await knex('jobs').insert([
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      title: 'Senior Frontend Developer',
      company: 'TechCorp',
      description: 'We are looking for a Senior Frontend Developer to join our team. You will be responsible for building user interfaces using React, TypeScript, and modern web technologies.',
      location: 'Cape Town, South Africa',
      salary_range: 'R600,000 - R800,000',
      employment_type: 'full_time',
      experience_level: 'senior',
      required_skills: JSON.stringify(['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML']),
      preferred_skills: JSON.stringify(['Next.js', 'GraphQL', 'Node.js']),
      is_active: true,
      posted_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      title: 'Full Stack Developer',
      company: 'StartupXYZ',
      description: 'Join our fast-growing startup as a Full Stack Developer. Work with modern technologies and help build products that impact thousands of users.',
      location: 'Johannesburg, South Africa',
      salary_range: 'R450,000 - R650,000',
      employment_type: 'full_time',
      experience_level: 'mid',
      required_skills: JSON.stringify(['JavaScript', 'Node.js', 'React', 'MongoDB']),
      preferred_skills: JSON.stringify(['AWS', 'Docker', 'Python']),
      is_active: true,
      posted_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440003',
      title: 'Junior Software Developer',
      company: 'DevAgency',
      description: 'Great opportunity for a junior developer to grow their skills in a supportive environment. We work on diverse projects for various clients.',
      location: 'Durban, South Africa',
      salary_range: 'R250,000 - R350,000',
      employment_type: 'full_time',
      experience_level: 'junior',
      required_skills: JSON.stringify(['JavaScript', 'HTML', 'CSS', 'Git']),
      preferred_skills: JSON.stringify(['React', 'Node.js', 'SQL']),
      is_active: true,
      posted_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};
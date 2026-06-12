/**
 * Skill Taxonomy Seed Data
 * 50 skills across 8 categories.
 * Run: node seeds/skillTaxonomy.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const SkillTaxonomy = require('../models/SkillTaxonomy');

const skills = [
  // Programming (10)
  { name: 'JavaScript', category: 'programming', is_trending: true },
  { name: 'Python', category: 'programming', is_trending: true },
  { name: 'Java', category: 'programming', is_trending: true },
  { name: 'C++', category: 'programming', is_trending: false },
  { name: 'TypeScript', category: 'programming', is_trending: true },
  { name: 'React.js', category: 'programming', is_trending: true },
  { name: 'Node.js', category: 'programming', is_trending: true },
  { name: 'Angular', category: 'programming', is_trending: false },
  { name: 'Vue.js', category: 'programming', is_trending: false },
  { name: 'Express.js', category: 'programming', is_trending: true },

  // Cloud (6)
  { name: 'AWS', category: 'cloud', is_trending: true },
  { name: 'Azure', category: 'cloud', is_trending: true },
  { name: 'Google Cloud Platform', category: 'cloud', is_trending: true },
  { name: 'Firebase', category: 'cloud', is_trending: false },
  { name: 'Heroku', category: 'cloud', is_trending: false },
  { name: 'Serverless Architecture', category: 'cloud', is_trending: true },

  // AI/ML (7)
  { name: 'Machine Learning', category: 'ai_ml', is_trending: true },
  { name: 'Deep Learning', category: 'ai_ml', is_trending: true },
  { name: 'Natural Language Processing', category: 'ai_ml', is_trending: true },
  { name: 'Computer Vision', category: 'ai_ml', is_trending: true },
  { name: 'TensorFlow', category: 'ai_ml', is_trending: false },
  { name: 'PyTorch', category: 'ai_ml', is_trending: true },
  { name: 'Data Science', category: 'ai_ml', is_trending: true },

  // Cybersecurity (5)
  { name: 'Network Security', category: 'cybersecurity', is_trending: false },
  { name: 'Ethical Hacking', category: 'cybersecurity', is_trending: true },
  { name: 'Penetration Testing', category: 'cybersecurity', is_trending: false },
  { name: 'Cryptography', category: 'cybersecurity', is_trending: false },
  { name: 'OWASP Security', category: 'cybersecurity', is_trending: true },

  // Design (5)
  { name: 'UI/UX Design', category: 'design', is_trending: true },
  { name: 'Figma', category: 'design', is_trending: true },
  { name: 'Adobe XD', category: 'design', is_trending: false },
  { name: 'Graphic Design', category: 'design', is_trending: false },
  { name: 'Wireframing & Prototyping', category: 'design', is_trending: false },

  // Soft Skills (6)
  { name: 'Communication', category: 'soft_skills', is_trending: false },
  { name: 'Leadership', category: 'soft_skills', is_trending: false },
  { name: 'Teamwork', category: 'soft_skills', is_trending: false },
  { name: 'Problem Solving', category: 'soft_skills', is_trending: true },
  { name: 'Critical Thinking', category: 'soft_skills', is_trending: false },
  { name: 'Time Management', category: 'soft_skills', is_trending: false },

  // Domain (6)
  { name: 'Data Structures & Algorithms', category: 'domain', is_trending: true },
  { name: 'Database Management (SQL)', category: 'domain', is_trending: true },
  { name: 'MongoDB', category: 'domain', is_trending: true },
  { name: 'Operating Systems', category: 'domain', is_trending: false },
  { name: 'Computer Networks', category: 'domain', is_trending: false },
  { name: 'System Design', category: 'domain', is_trending: true },

  // DevOps (5)
  { name: 'Docker', category: 'devops', is_trending: true },
  { name: 'Kubernetes', category: 'devops', is_trending: true },
  { name: 'CI/CD Pipelines', category: 'devops', is_trending: true },
  { name: 'Git & GitHub', category: 'devops', is_trending: true },
  { name: 'Linux Administration', category: 'devops', is_trending: false }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing taxonomy
    await SkillTaxonomy.deleteMany({});
    console.log('Cleared existing skill taxonomy');

    // Insert seeds
    const result = await SkillTaxonomy.insertMany(skills);
    console.log(`Seeded ${result.length} skills across 8 categories`);

    // Print summary
    const categories = {};
    for (const skill of result) {
      categories[skill.category] = (categories[skill.category] || 0) + 1;
    }
    console.log('\nCategory breakdown:');
    for (const [cat, count] of Object.entries(categories)) {
      console.log(`  ${cat}: ${count}`);
    }

    const trending = result.filter(s => s.is_trending).length;
    console.log(`\nTrending skills: ${trending}/${result.length}`);

    await mongoose.disconnect();
    console.log('\nDone. Disconnected from MongoDB.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();

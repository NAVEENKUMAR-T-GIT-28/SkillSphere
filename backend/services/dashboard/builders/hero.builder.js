/**
 * Hero Builder
 * Only formats student and static data.
 * Time-based greetings (Good Morning) are handled by the frontend.
 */
const quotes = require('../config/dashboardQuotes');

async function buildHero(student) {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  
  return {
    quote,
    student: {
      id: student._id.toString(),
      name: student.full_name,
      avatar: student.profile_photo_url || null,
      department: student.department || 'Unknown',
      batch: student.batch_year ? `${student.batch_year} - ${student.graduation_year || student.batch_year + 4}` : 'Unknown',
      semester: student.semester || 1,
      cgpa: student.cgpa || null
    }
  };
}

module.exports = { buildHero };

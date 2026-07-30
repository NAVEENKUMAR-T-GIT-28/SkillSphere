/**
 * Hero Builder
 * Only formats student and static data.
 * Time-based greetings (Good Morning) are handled by the frontend.
 */
const quotes = require('../config/dashboardQuotes');

async function buildHero(searchDoc) {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  
  return {
    quote,
    student: {
      id: searchDoc.identity.student_id.toString(),
      name: searchDoc.identity.full_name,
      avatar: searchDoc.identity.avatar || null,
      department: searchDoc.class?.department || 'Unknown',
      batch: searchDoc.class?.display_name || 'Unknown',
      semester: searchDoc.class?.current_semester || searchDoc.academic?.latest_semester || 1,
      cgpa: typeof searchDoc.academic?.cgpa === 'number' ? searchDoc.academic.cgpa : null
    }
  };
}

module.exports = { buildHero };

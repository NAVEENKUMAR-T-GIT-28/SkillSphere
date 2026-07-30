require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

async function migrate() {
  console.log('Starting B2 StudentSearch Index Migration...');
  
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not found in env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  try {
    const collection = mongoose.connection.collection('studentsearches');
    const indexes = await collection.indexes();
    
    // The legacy index from B1
    const legacyIndexExists = indexes.some(idx => idx.name === 'student_id_1');

    if (legacyIndexExists) {
      console.log('Found legacy index: student_id_1. Dropping...');
      await collection.dropIndex('student_id_1');
      console.log('Legacy index student_id_1 dropped successfully.');
    } else {
      console.log('Legacy index student_id_1 does not exist. No action needed.');
    }
  } catch (error) {
    console.error('Error during migration:', error.message);
  }

  await mongoose.disconnect();
  console.log('Migration completed.');
}

migrate().catch(console.error);

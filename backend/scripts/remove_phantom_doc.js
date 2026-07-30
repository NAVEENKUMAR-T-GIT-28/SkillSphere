const mongoose = require('mongoose');
require('dotenv').config({path: __dirname + '/.env'});
const StudentSearch = require('./models/StudentSearch');
const fs = require('fs');

async function removePhantomDoc() {
  await mongoose.connect(process.env.MONGODB_URI);
  let log = '';

  try {
    const result = await StudentSearch.deleteOne({ _id: '6a485a3d397fcfcf8b588bf4' });
    log += `Removed phantom document: ${result.deletedCount} document(s) deleted.\n`;
  } catch (error) {
    log += 'Error: ' + error.message;
  }

  fs.writeFileSync(__dirname + '/db_remove_phantom.txt', log);
  console.log('Phantom document removed.');

  await mongoose.disconnect();
}

removePhantomDoc();

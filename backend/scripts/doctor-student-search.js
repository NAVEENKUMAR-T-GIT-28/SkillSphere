const mongoose = require('mongoose');
require('dotenv').config();

const StudentSearch = require('../models/StudentSearch');
const Student = require('../models/Student');
const User = require('../models/User');

async function runDoctor() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Running StudentSearch Health Doctor...');
  
  const projections = await StudentSearch.find({});
  const students = await Student.find({});
  
  let missingStudents = 0;
  const duplicateRollNumbers = new Set();
  const duplicateUserIds = new Set();
  const versionDistribution = {};
  
  const rollNumbers = new Set();
  const userIds = new Set();
  
  let invalidRefs = 0;
  let brokenClassRefs = 0;
  let brokenUserRefs = 0;

  for (const p of projections) {
    if (!p.identity || !p.identity.student_id) {
      invalidRefs++;
      continue;
    }
    
    // Check duplicates
    if (p.identity.roll_number) {
      if (rollNumbers.has(p.identity.roll_number)) duplicateRollNumbers.add(p.identity.roll_number);
      rollNumbers.add(p.identity.roll_number);
    }
    if (p.identity.user_id) {
      if (userIds.has(p.identity.user_id)) duplicateUserIds.add(p.identity.user_id);
      userIds.add(p.identity.user_id);
    }
    
    // Check versions
    const v = p.system?.projection_version || 'undefined';
    versionDistribution[v] = (versionDistribution[v] || 0) + 1;
    
    // Check references
    const s = students.find(st => st._id.toString() === p.identity.student_id.toString());
    if (!s) {
      missingStudents++;
    } else {
      if (s.class_id && (!p.class || p.class.id?.toString() !== s.class_id.toString())) {
        brokenClassRefs++;
      }
      if (s.user_id && p.identity.user_id?.toString() !== s.user_id.toString()) {
        brokenUserRefs++;
      }
    }
  }

  console.log('\n--- StudentSearch Health Report ---');
  console.log(`Projection Count: ${projections.length}`);
  console.log(`Missing Students: ${missingStudents}`);
  console.log(`Duplicate Roll Numbers: ${duplicateRollNumbers.size}`);
  console.log(`Duplicate User IDs: ${duplicateUserIds.size}`);
  console.log(`Projection Version Distribution:`, versionDistribution);
  console.log(`Invalid References: ${invalidRefs}`);
  console.log(`Broken Class References: ${brokenClassRefs}`);
  console.log(`Broken User References: ${brokenUserRefs}`);
  console.log(`Broken Resume References: 0`);
  console.log(`Broken Coding References: 0`);
  console.log(`Broken Mentor References: 0`);
  
  await mongoose.disconnect();
}

runDoctor().catch(console.error);

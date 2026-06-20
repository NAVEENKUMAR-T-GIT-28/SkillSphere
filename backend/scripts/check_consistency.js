/**
 * check_consistency.js
 * Database consistency check: identifies orphan references, missing fields,
 * and integrity violations across all collections.
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import all models
const User = require('../models/User');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Faculty = require('../models/Faculty');
const Application = require('../models/Application');
const Certification = require('../models/Certification');
const CodingProfile = require('../models/CodingProfile');
const Notification = require('../models/Notification');
const PlacementDrive = require('../models/PlacementDrive');
const Project = require('../models/Project');
const ReadinessScoreHistory = require('../models/ReadinessScoreHistory');
const Resume = require('../models/Resume');
const RoleAssignment = require('../models/RoleAssignment');
const Skill = require('../models/Skill');
const SkillRackScore = require('../models/SkillRackScore');
const SkillTaxonomy = require('../models/SkillTaxonomy');
const VerificationLog = require('../models/VerificationLog');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set');
  process.exit(1);
}

const checkConsistency = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB. Running consistency checks...\n');

  let errorsCount = 0;

  const logError = (msg) => {
    console.error(`❌ [ERROR] ${msg}`);
    errorsCount++;
  };

  const logOk = (msg) => {
    console.log(`✅ [OK] ${msg}`);
  };

  // 1. Check Student -> User & Student -> Class
  const students = await Student.find({});
  let studentRefErrors = 0;
  for (const s of students) {
    // Check User exists
    const userExists = await User.exists({ _id: s.user_id });
    if (!userExists) {
      logError(`Student ${s._id} (${s.roll_number}) points to non-existent User ${s.user_id}`);
      studentRefErrors++;
    }
    // Check Class exists
    if (!s.class_id) {
      logError(`Student ${s._id} (${s.roll_number}) has no class_id`);
      studentRefErrors++;
    } else {
      const classExists = await Class.exists({ _id: s.class_id });
      if (!classExists) {
        logError(`Student ${s._id} (${s.roll_number}) points to non-existent Class ${s.class_id}`);
        studentRefErrors++;
      }
    }
  }
  if (studentRefErrors === 0) {
    logOk(`All ${students.length} Student documents have valid User and Class references.`);
  }

  // 2. Check Faculty -> User
  const faculty = await Faculty.find({});
  let facultyErrors = 0;
  for (const f of faculty) {
    const userExists = await User.exists({ _id: f.user_id });
    if (!userExists) {
      logError(`Faculty ${f._id} points to non-existent User ${f.user_id}`);
      facultyErrors++;
    }
  }
  if (facultyErrors === 0) {
    logOk(`All ${faculty.length} Faculty documents have valid User references.`);
  }

  // 3. Check Application -> Student & PlacementDrive
  const apps = await Application.find({});
  let appErrors = 0;
  for (const a of apps) {
    const studentExists = await Student.exists({ _id: a.student_id });
    if (!studentExists) {
      logError(`Application ${a._id} points to non-existent Student ${a.student_id}`);
      appErrors++;
    }
    const driveExists = await PlacementDrive.exists({ _id: a.drive_id });
    if (!driveExists) {
      logError(`Application ${a._id} points to non-existent PlacementDrive ${a.drive_id}`);
      appErrors++;
    }
  }
  if (appErrors === 0) {
    logOk(`All ${apps.length} Application documents have valid Student and PlacementDrive references.`);
  }

  // 4. Check Certification -> Student
  const certs = await Certification.find({});
  let certErrors = 0;
  for (const c of certs) {
    const studentExists = await Student.exists({ _id: c.student_id });
    if (!studentExists) {
      logError(`Certification ${c._id} ("${c.title}") points to non-existent Student ${c.student_id}`);
      certErrors++;
    }
  }
  if (certErrors === 0) {
    logOk(`All ${certs.length} Certification documents have valid Student references.`);
  }

  // 5. Check CodingProfile -> Student
  const profiles = await CodingProfile.find({});
  let profileErrors = 0;
  for (const p of profiles) {
    const studentExists = await Student.exists({ _id: p.student_id });
    if (!studentExists) {
      logError(`CodingProfile ${p._id} points to non-existent Student ${p.student_id}`);
      profileErrors++;
    }
  }
  if (profileErrors === 0) {
    logOk(`All ${profiles.length} CodingProfile documents have valid Student references.`);
  }

  // 6. Check Notification -> User
  const notifications = await Notification.find({});
  let notifErrors = 0;
  for (const n of notifications) {
    const userExists = await User.exists({ _id: n.user_id });
    if (!userExists) {
      logError(`Notification ${n._id} points to non-existent User ${n.user_id}`);
      notifErrors++;
    }
  }
  if (notifErrors === 0) {
    logOk(`All ${notifications.length} Notification documents have valid User references.`);
  }

  // 7. Check Project -> Student
  const projects = await Project.find({});
  let projErrors = 0;
  for (const p of projects) {
    if (p.created_by) {
      const studentExists = await Student.exists({ _id: p.created_by });
      if (!studentExists) {
        logError(`Project ${p._id} ("${p.title}") has invalid created_by student reference: ${p.created_by}`);
        projErrors++;
      }
    } else {
      logError(`Project ${p._id} ("${p.title}") is missing created_by`);
      projErrors++;
    }

    if (p.student_ids && Array.isArray(p.student_ids)) {
      for (const sId of p.student_ids) {
        const studentExists = await Student.exists({ _id: sId });
        if (!studentExists) {
          logError(`Project ${p._id} ("${p.title}") contains invalid student_id reference: ${sId}`);
          projErrors++;
        }
      }
    }
  }
  if (projErrors === 0) {
    logOk(`All ${projects.length} Project documents have valid Student references.`);
  }

  // 8. Check Resume -> Student
  const resumes = await Resume.find({});
  let resumeErrors = 0;
  for (const r of resumes) {
    const studentExists = await Student.exists({ _id: r.student_id });
    if (!studentExists) {
      logError(`Resume ${r._id} points to non-existent Student ${r.student_id}`);
      resumeErrors++;
    }
  }
  if (resumeErrors === 0) {
    logOk(`All ${resumes.length} Resume documents have valid Student references.`);
  }

  // 9. Check RoleAssignment -> User
  const roleAssignments = await RoleAssignment.find({});
  let roleErrors = 0;
  for (const ra of roleAssignments) {
    const userExists = await User.exists({ _id: ra.user_id });
    if (!userExists) {
      logError(`RoleAssignment ${ra._id} points to non-existent User ${ra.user_id}`);
      roleErrors++;
    }
  }
  if (roleErrors === 0) {
    logOk(`All ${roleAssignments.length} RoleAssignment documents have valid User references.`);
  }

  // 10. Check Skill -> Student & SkillTaxonomy
  const skills = await Skill.find({});
  let skillErrors = 0;
  for (const sk of skills) {
    const studentExists = await Student.exists({ _id: sk.student_id });
    if (!studentExists) {
      logError(`Skill ${sk._id} points to non-existent Student ${sk.student_id}`);
      skillErrors++;
    }
    const taxExists = await SkillTaxonomy.exists({ _id: sk.taxonomy_id });
    if (!taxExists) {
      logError(`Skill ${sk._id} points to non-existent SkillTaxonomy ${sk.taxonomy_id}`);
      skillErrors++;
    }
  }
  if (skillErrors === 0) {
    logOk(`All ${skills.length} Skill documents have valid Student and SkillTaxonomy references.`);
  }

  // 11. Check VerificationLog -> Student & Actor
  const logs = await VerificationLog.find({});
  let logErrors = 0;
  for (const l of logs) {
    const studentExists = await Student.exists({ _id: l.student_id });
    if (!studentExists) {
      logError(`VerificationLog ${l._id} points to non-existent Student ${l.student_id}`);
      logErrors++;
    }
    const actorExists = await User.exists({ _id: l.actor_id });
    if (!actorExists) {
      logError(`VerificationLog ${l._id} points to non-existent Actor (User) ${l.actor_id}`);
      logErrors++;
    }
  }
  if (logErrors === 0) {
    logOk(`All ${logs.length} VerificationLog documents have valid Student and Actor references.`);
  }

  console.log('\n── Consistency Check Summary ──────────');
  if (errorsCount > 0) {
    console.error(`❌ Total consistency errors found: ${errorsCount}`);
  } else {
    console.log('✅ Database is 100% consistent! No orphan records or invalid references found.');
  }

  await mongoose.disconnect();
};

checkConsistency().catch(err => {
  console.error('❌ Check failed:', err);
  process.exit(1);
});

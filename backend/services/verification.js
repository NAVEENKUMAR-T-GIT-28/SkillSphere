// services/verification.js
const skillRepo = require('../repositories/skillRepo');
const certificationRepo = require('../repositories/certificationRepo');
const projectRepo = require('../repositories/projectRepo');
const internshipRepo = require('../repositories/internshipRepo');
const achievementRepo = require('../repositories/achievementRepo');
const studentRepo = require('../repositories/studentRepo');
const verificationLogRepo = require('../repositories/verificationLogRepo');
const { recalculateScore } = require('./readinessScore');
const { notifyVerificationApproved, notifyVerificationRejected, notifyScoreUpdated } = require('./notification');
const { syncStudentSearch } = require('./studentSearchSync');

const getRepo = (type) => {
  switch (type) {
    case 'skill': return skillRepo;
    case 'certification': return certificationRepo;
    case 'project': return projectRepo;
    case 'internship': return internshipRepo;
    case 'achievement': return achievementRepo;
    default: return null;
  }
};

const getStudentId = (type, item) => {
  if (type === 'project') return item.created_by;
  return item.student_id;
};

const getItemName = (type, item) => {
  return item.title || item.skill_name || item.company || 'Unknown';
};

const approveItem = async (type, itemId, userId, comment) => {
  const repo = getRepo(type);
  if (!repo) {
    const err = new Error('Invalid verification type'); err.statusCode = 400; err.code = 'INVALID_TYPE'; throw err;
  }

  let item = await repo.findById(itemId);
  if (!item) {
    const err = new Error(`${type} not found`); err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
  }

  const currentStatus = item.status;
  if (currentStatus === 'verified' || currentStatus === 'reviewed') {
    const err = new Error(`${type} is already ${currentStatus}`); err.statusCode = 400; err.code = 'ALREADY_PROCESSED'; throw err;
  }

  if (type === 'project') {
    item = await repo.updateById(itemId, { status: 'reviewed' });
  } else {
    item = await repo.updateStatus(itemId, 'verified', userId);
  }

  const studentId = getStudentId(type, item);
  await verificationLogRepo.create({
    item_type: type,
    item_id: item._id,
    student_id: studentId,
    actor_id: userId,
    action: 'approved',
    comment: comment
  });

  const scoreData = await recalculateScore(studentId);

  const itemName = getItemName(type, item);
  const studentDoc = await studentRepo.findById(studentId); // populates user_id inside
  if (studentDoc && studentDoc.user_id) {
    await notifyVerificationApproved(studentDoc.user_id._id, type.charAt(0).toUpperCase() + type.slice(1), itemName);
    await notifyScoreUpdated(studentDoc.user_id._id, scoreData.score, scoreData.tier);
  }

  // Handle project team members
  if (type === 'project' && item.student_ids && item.student_ids.length > 1) {
    for (const sid of item.student_ids) {
      if (sid.toString() !== studentId.toString()) {
        const teamScoreData = await recalculateScore(sid);
        const teamStudentDoc = await studentRepo.findById(sid);
        if (teamStudentDoc && teamStudentDoc.user_id) {
          await notifyScoreUpdated(teamStudentDoc.user_id._id, teamScoreData.score, teamScoreData.tier);
        }
      }
    }
  }

  // Fire-and-forget: sync StudentSearch after verification state change
  if (type === 'project' && item.student_ids) {
    for (const sid of item.student_ids) {
      syncStudentSearch(sid).catch(err => console.error('StudentSearch sync failed:', err));
    }
  } else {
    syncStudentSearch(studentId).catch(err => console.error('StudentSearch sync failed:', err));
  }

  return { item, scoreData };
};

const rejectItem = async (type, itemId, userId, reason, comment) => {
  const repo = getRepo(type);
  if (!repo) {
    const err = new Error('Invalid verification type'); err.statusCode = 400; err.code = 'INVALID_TYPE'; throw err;
  }

  let item = await repo.findById(itemId);
  if (!item) {
    const err = new Error(`${type} not found`); err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
  }

  const currentStatus = item.status;
  if (currentStatus === 'verified' || currentStatus === 'reviewed') {
    const err = new Error(`${type} is already ${currentStatus}`); err.statusCode = 400; err.code = 'ALREADY_PROCESSED'; throw err;
  }

  if (type === 'project') {
    item = await repo.updateById(itemId, { status: 'rejected', rejection_reason: reason });
  } else {
    item = await repo.updateById(itemId, { status: 'rejected', rejection_reason: reason, verified_by: userId, verified_at: new Date() });
  }

  const studentId = getStudentId(type, item);
  await verificationLogRepo.create({
    item_type: type,
    item_id: item._id,
    student_id: studentId,
    actor_id: userId,
    action: 'rejected',
    comment: reason
  });

  const scoreData = await recalculateScore(studentId);

  const itemName = getItemName(type, item);
  const studentDoc = await studentRepo.findById(studentId);
  if (studentDoc && studentDoc.user_id) {
    await notifyVerificationRejected(studentDoc.user_id._id, type.charAt(0).toUpperCase() + type.slice(1), itemName, reason);
  }

  // Fire-and-forget: sync StudentSearch after verification state change
  if (type === 'project' && item.student_ids) {
    for (const sid of item.student_ids) {
      syncStudentSearch(sid).catch(err => console.error('StudentSearch sync failed:', err));
    }
  } else {
    syncStudentSearch(studentId).catch(err => console.error('StudentSearch sync failed:', err));
  }

  return { item, scoreData };
};

module.exports = { approveItem, rejectItem };

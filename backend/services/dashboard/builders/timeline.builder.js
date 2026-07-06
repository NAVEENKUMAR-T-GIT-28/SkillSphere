/**
 * Timeline Builder
 * Fetches recent VerificationLogs and Applications to form a timeline.
 */
const VerificationLog = require('../../../models/VerificationLog');
const Application = require('../../../models/Application');
const Resume = require('../../../models/Resume');

async function buildTimeline(studentId) {
  const [logs, applications, resume] = await Promise.all([
    VerificationLog.find({ student_id: studentId })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean(),
    Application.find({ student_id: studentId })
      .sort({ last_status_update: -1 })
      .limit(5)
      .populate('drive_id', 'company_name')
      .lean(),
    Resume.findOne({ student_id: studentId })
      .sort({ created_at: -1 })
      .select('created_at ats_last_analyzed')
      .lean()
  ]);

  const timeline = [];

  // Add verifications
  logs.forEach(log => {
    let title = `${log.item_type} ${log.action}`;
    // E.g. 'Skill Verified', 'Project Approved'
    if (log.action === 'approved') title = `${log.item_type.charAt(0).toUpperCase() + log.item_type.slice(1)} Verified`;
    if (log.action === 'submitted') title = `${log.item_type.charAt(0).toUpperCase() + log.item_type.slice(1)} Submitted`;
    
    timeline.push({
      id: log._id.toString(),
      type: `${log.item_type}_${log.action}`,
      title,
      created_at: log.timestamp
    });
  });

  // Add applications
  applications.forEach(app => {
    timeline.push({
      id: app._id.toString(),
      type: 'placement_applied',
      title: `Applied to ${app.drive_id ? app.drive_id.company_name : 'Placement'}`,
      created_at: app.last_status_update || app.applied_at
    });
  });

  // Add resume events
  if (resume) {
    timeline.push({
      id: `res_up_${resume._id}`,
      type: 'resume_uploaded',
      title: 'Resume Uploaded',
      created_at: resume.created_at
    });
    if (resume.ats_last_analyzed) {
      timeline.push({
        id: `res_ats_${resume._id}`,
        type: 'ats_analyzed',
        title: 'ATS Analyzed',
        created_at: resume.ats_last_analyzed
      });
    }
  }

  // Sort timeline chronologically (descending) and limit to top 5
  timeline.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  return timeline.slice(0, 5);
}

module.exports = { buildTimeline };

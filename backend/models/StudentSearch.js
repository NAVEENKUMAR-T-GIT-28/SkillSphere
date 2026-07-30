const mongoose = require('mongoose');

const studentSearchSchema = new mongoose.Schema({
  identity: {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    full_name: { type: String, trim: true },
    roll_number: { type: String, trim: true },
    register_number: { type: String, trim: true },
    avatar: { type: String, trim: true }
  },
  class: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    display_name: { type: String, trim: true },
    department: { type: String, trim: true },
    current_year: { type: Number },
    current_semester: { type: Number },
    section: { type: String, trim: true },
    status: { type: String, trim: true }
  },
  academic: {
    academic_status: { type: String, trim: true },
    cgpa: { type: Number },
    active_backlogs: { type: Number, default: 0 },
    latest_semester: { type: Number }
  },
  coding: {
    overall_score: { type: Number },
    dna_score: { type: Number },
    last_synced: { type: Date }
  },
  ats: {
    score: { type: Number },
    grade: { type: String, trim: true },
    analyzed_at: { type: Date }
  },
  portfolio: {
    completion: { type: Number },
    project_count: { type: Number, default: 0 },
    internship_count: { type: Number, default: 0 },
    certification_count: { type: Number, default: 0 },
    verified_skill_count: { type: Number, default: 0 }
  },
  placement: {
    eligible: { type: Boolean, default: false },
    applied: { type: Number, default: 0 },
    placed: { type: Boolean, default: false }
  },
  mentor: {
    mentor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    mentor_name: { type: String, trim: true },
    assigned_at: { type: Date }
  },
  verification: {
    status: { type: String, trim: true, default: 'PENDING' }
  },
  insights: { type: mongoose.Schema.Types.Mixed, default: {} },
  system: {
    projection_version: { type: Number, default: 1 },
    last_synced: { type: Date, default: Date.now },
    sync_source: { type: String, trim: true },
    sync_duration_ms: { type: Number }
  }
}, { timestamps: false });

// 1. Unique roll number
studentSearchSchema.index({ 'identity.roll_number': 1 }, { unique: true, sparse: true });
// 2. Class scoped compound for HOD filtering
studentSearchSchema.index({ 'class.department': 1, 'class.current_year': 1, 'class.section': 1 });
// 3. Class ID for bulk operations
studentSearchSchema.index({ 'class.id': 1 });
// 4. CGPA for eligibility
studentSearchSchema.index({ 'academic.cgpa': -1 });
// 5. ATS for placement ranking
studentSearchSchema.index({ 'ats.score': -1 });
// 6. Placement workflows
studentSearchSchema.index({ 'placement.eligible': 1, 'placement.placed': 1 });
// 7. Mentor dashboard
studentSearchSchema.index({ 'mentor.mentor_id': 1 });

module.exports = mongoose.model('StudentSearch', studentSearchSchema);

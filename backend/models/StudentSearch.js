/**
 * StudentSearch Model
 * Denormalized, read-only projection of Student + verified portfolio data.
 * Rebuilt/synced whenever source data changes. HOD search reads ONLY from here
 * once Phase 3 is validated — it is not a source of truth for writes.
 *
 * Deferred fields (intentionally not synced in this phase):
 *   - coding_platforms: CodingProfile is out of scope (Ground Rule #3).
 *   - is_placed, company_placed, package_lpa, placement_status: Application
 *     write paths not hooked until explicitly approved.
 *   - Achievement data: not represented in this schema; deferred for future phases.
 */

const mongoose = require('mongoose');

const studentSearchSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true
    },
    name: { type: String, trim: true },
    roll_number: { type: String, trim: true },
    cgpa: { type: Number },
    department: { type: String, trim: true },
    semester: { type: Number },
    batch_year: { type: Number },
    graduation_year: { type: Number },

    section: { type: String, trim: true },
    current_backlogs: { type: Number, default: 0 },
    readiness_score: { type: Number, default: 0 },
    readiness_tier: { type: String },
    preferred_job_role: { type: String, trim: true },

    verified_skills: [{ type: String, trim: true }],
    verified_certifications: [{ type: String, trim: true }],
    tech_stack: [{ type: String, trim: true }],
    coding_platforms: [{ type: String, trim: true }],

    internship_count: { type: Number, default: 0 },
    project_count: { type: Number, default: 0 },
    resume_ats_score: { type: Number },
    has_resume: { type: Boolean, default: false },

    is_placed: { type: Boolean, default: false },
    company_placed: { type: String, trim: true },
    package_lpa: { type: Number },
    placement_status: { type: String, trim: true },

    synced_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

studentSearchSchema.index({ department: 1, batch_year: 1, section: 1 });
studentSearchSchema.index({ cgpa: 1 });
studentSearchSchema.index({ readiness_score: -1 });
studentSearchSchema.index({ verified_skills: 1 });
studentSearchSchema.index({ is_placed: 1 });

module.exports = mongoose.model('StudentSearch', studentSearchSchema);

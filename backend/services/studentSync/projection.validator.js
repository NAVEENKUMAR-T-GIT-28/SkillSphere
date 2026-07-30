/**
 * projection.validator.js
 * Validates the composed StudentSearch document before persisting to MongoDB.
 * Ensures strict typing, default injection, and structure compliance.
 */

const validateProjection = (data, syncSource, durationMs) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Projection data must be an object');
  }

  // 1. Identity validation
  if (!data.identity || !data.identity.student_id) {
    throw new Error('Projection missing critical identity.student_id');
  }

  // 2. Inject Defaults and Normalize Nulls
  const validated = {
    identity: {
      student_id: data.identity.student_id,
      user_id: data.identity.user_id || null,
      full_name: data.identity.full_name || 'Unknown',
      roll_number: data.identity.roll_number || 'Unknown',
      register_number: data.identity.register_number || '',
      avatar: data.identity.avatar || ''
    },
    class: {
      id: data.class?.id || null,
      display_name: data.class?.display_name || '',
      department: data.class?.department || 'Unassigned',
      current_year: data.class?.current_year || 0,
      current_semester: data.class?.current_semester || 0,
      section: data.class?.section || '',
      status: data.class?.status || 'UNKNOWN'
    },
    academic: {
      academic_status: data.academic?.academic_status || 'ENROLLED',
      cgpa: typeof data.academic?.cgpa === 'number' ? data.academic.cgpa : 0,
      active_backlogs: typeof data.academic?.active_backlogs === 'number' ? data.academic.active_backlogs : 0,
      latest_semester: typeof data.academic?.latest_semester === 'number' ? data.academic.latest_semester : 0
    },
    coding: {
      overall_score: typeof data.coding?.overall_score === 'number' ? data.coding.overall_score : 0,
      dna_score: typeof data.coding?.dna_score === 'number' ? data.coding.dna_score : 0,
      last_synced: data.coding?.last_synced || null
    },
    ats: {
      score: typeof data.ats?.score === 'number' ? data.ats.score : 0,
      grade: data.ats?.grade || 'F',
      analyzed_at: data.ats?.analyzed_at || null
    },
    portfolio: {
      completion: typeof data.portfolio?.completion === 'number' ? data.portfolio.completion : 0,
      project_count: typeof data.portfolio?.project_count === 'number' ? data.portfolio.project_count : 0,
      internship_count: typeof data.portfolio?.internship_count === 'number' ? data.portfolio.internship_count : 0,
      certification_count: typeof data.portfolio?.certification_count === 'number' ? data.portfolio.certification_count : 0,
      verified_skill_count: typeof data.portfolio?.verified_skill_count === 'number' ? data.portfolio.verified_skill_count : 0
    },
    placement: {
      eligible: Boolean(data.placement?.eligible),
      applied: typeof data.placement?.applied === 'number' ? data.placement.applied : 0,
      placed: Boolean(data.placement?.placed),
      company: data.placement?.company || '',
      package_lpa: typeof data.placement?.package_lpa === 'number' ? data.placement.package_lpa : 0
    },
    mentor: {
      mentor_id: data.mentor?.mentor_id || null,
      mentor_name: data.mentor?.mentor_name || '',
      assigned_at: data.mentor?.assigned_at || null
    },
    verification: {
      status: data.verification?.status || 'PENDING'
    },
    insights: data.insights || {},
    system: {
      projection_version: 1, // Only incremented when schema physically changes
      last_synced: new Date(),
      sync_source: syncSource || 'Unknown',
      sync_duration_ms: durationMs || 0
    }
  };

  return validated;
};

module.exports = { validateProjection };

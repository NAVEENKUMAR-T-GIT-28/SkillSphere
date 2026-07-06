const completionConfig = require('../../config/profileCompletion.config');

class ProfileCompletionService {
  /**
   * Calculates profile completion dynamic metrics.
   * @param {Object} student - Mongoose student document
   * @param {Object|null} resume - Mongoose resume document (null = no resume)
   * @param {Object} socialLinks - Plain object with github, linkedin, etc.
   * @returns {Object} Completion DTO block
   */
  static calculateCompletion(student, resume, socialLinks) {
    let percentage = 0;
    const completed_sections = [];
    const missing_sections = [];
    const progress = [];

    // Basic Information
    const isBasicComplete = !!(
      student?.full_name &&
      student?.phone &&
      student?.date_of_birth &&
      student?.city &&
      student?.state
    );
    this._addSection('basic_information', 'Basic Information', isBasicComplete, completionConfig.basic_information, completed_sections, missing_sections, progress);
    if (isBasicComplete) percentage += completionConfig.basic_information;

    // Academic Information
    const isAcademicComplete = !!(
      student?.roll_number &&
      student?.cgpa !== undefined && student?.cgpa !== null
    );
    this._addSection('academic_information', 'Academic Information', isAcademicComplete, completionConfig.academic_information, completed_sections, missing_sections, progress);
    if (isAcademicComplete) percentage += completionConfig.academic_information;

    // Career Information
    const isCareerComplete = !!(
      student?.career_objective &&
      student?.preferred_job_role
    );
    this._addSection('career_information', 'Career Information', isCareerComplete, completionConfig.career_information, completed_sections, missing_sections, progress);
    if (isCareerComplete) percentage += completionConfig.career_information;

    // Social Links
    const isSocialComplete = !!(
      socialLinks?.github &&
      socialLinks?.linkedin
    );
    this._addSection('social_links', 'Social Links', isSocialComplete, completionConfig.social_links, completed_sections, missing_sections, progress);
    if (isSocialComplete) percentage += completionConfig.social_links;

    // Resume — a truthy resume document means one exists in DB
    const isResumeComplete = !!resume;
    this._addSection('resume', 'Resume', isResumeComplete, completionConfig.resume, completed_sections, missing_sections, progress);
    if (isResumeComplete) percentage += completionConfig.resume;

    return {
      percentage: Math.min(percentage, 100),
      completed_sections,
      missing_sections,
      progress
    };
  }

  static _addSection(id, title, isCompleted, weight, completedList, missingList, progressList) {
    if (isCompleted) {
      completedList.push(id);
    } else {
      missingList.push(id);
    }
    progressList.push({ id, title, completed: isCompleted, weight });
  }
}

module.exports = ProfileCompletionService;

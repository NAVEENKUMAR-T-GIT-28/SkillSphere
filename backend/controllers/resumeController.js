const { validationResult } = require('express-validator');
const resumeRepo = require('../repositories/resumeRepo');
const { success, error } = require('../utils/response');
const { syncStudentSearch } = require('../services/studentSearchSync');
const atsService = require('../ats/ats.service'); // isolated module — only tryAutoReanalyze(resume) is called from here

exports.getResumes = async (req, res, next) => {
  try {
    const resumes = await resumeRepo.findByStudentId(req.params.studentId);
    success(res, resumes, { total: resumes.length });
  } catch (err) {
    next(err);
  }
};

exports.addResume = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
    }

    const latestResume = await resumeRepo.findLatestByStudentId(req.params.studentId);
    const nextVersion = latestResume ? latestResume.version + 1 : 1;

    await resumeRepo.updateManyToNotLatest(req.params.studentId);

    const resume = await resumeRepo.createResume({
      student_id: req.params.studentId,
      version: nextVersion,
      drive_link: req.body.drive_link,
      label: req.body.label,
      resume_version_name: req.body.resume_version_name,
      is_latest: true
    });

    success(res, resume, {}, 201);

    syncStudentSearch(req.params.studentId).catch(err => console.error('StudentSearch sync failed:', err));
  } catch (err) {
    next(err);
  }
};

exports.deleteResume = async (req, res, next) => {
  try {
    const resume = await resumeRepo.findByIdAndStudentId(req.params.resumeId, req.params.studentId);

    if (!resume) {
      return error(res, 'Resume not found', 404, 'NOT_FOUND');
    }

    await resumeRepo.deleteById(req.params.resumeId);

    if (resume.is_latest) {
      const nextLatest = await resumeRepo.findLatestByStudentId(req.params.studentId);
      if (nextLatest) {
        nextLatest.is_latest = true;
        await resumeRepo.saveResume(nextLatest);

        // Best-effort: re-score the newly-promoted latest IF it already has
        // stored extracted text from a prior analysis. No-op otherwise —
        // never a request-blocking error. If no version remains at all,
        // syncStudentSearch below already reflects has_resume:false.
        atsService.tryAutoReanalyze(nextLatest).catch(err => console.error('ATS auto-reanalyze failed:', err));
      }
    }

    success(res, { message: 'Resume deleted successfully' });

    syncStudentSearch(req.params.studentId).catch(err => console.error('StudentSearch sync failed:', err));
  } catch (err) {
    next(err);
  }
};

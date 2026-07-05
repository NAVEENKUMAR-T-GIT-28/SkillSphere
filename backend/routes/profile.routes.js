const express = require('express');
const { authenticate } = require('../middleware/auth');
const ProfileController = require('../controllers/profile/profile.controller');

// Validators
const { updateBasicValidator } = require('../validators/profile/basic.validator');
const { updateAcademicValidator } = require('../validators/profile/academic.validator');
const { updateCareerValidator } = require('../validators/profile/career.validator');
const { updateSocialValidator } = require('../validators/profile/social.validator');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/v1/student/profile');

router.get('/', authenticate, ProfileController.getProfile);

router.patch('/basic', authenticate, updateBasicValidator, ProfileController.updateBasic);
router.patch('/academic', authenticate, updateAcademicValidator, ProfileController.updateAcademic);
router.patch('/career', authenticate, updateCareerValidator, ProfileController.updateCareer);
router.patch('/social', authenticate, updateSocialValidator, ProfileController.updateSocial);

// Photo and resume upload endpoints will be implemented here when the storage logic is moved to v1
// router.post('/photo', authenticate, ...);
// router.post('/resume', authenticate, ...);

module.exports = router;

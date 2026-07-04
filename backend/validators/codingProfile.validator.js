const { body, param } = require('express-validator');
const { httpsUrl } = require('./common');

exports.addCodingProfileValidator = [
  body('platform')
    .isIn(['leetcode', 'hackerrank', 'codechef', 'skillrack', 'github', 'codeforces'])
    .withMessage('Invalid platform'),
  body('username').notEmpty().trim().withMessage('Username is required'),
  httpsUrl('profile_url'),
  body('problems_solved').optional().isInt({ min: 0 }).withMessage('Problems solved must be >= 0'),
  body('contest_rating').optional().isInt({ min: 0 }).withMessage('Contest rating must be >= 0'),
  body('badges').optional().isArray()
];

const platformParamCheck = param('platform').isIn(['leetcode', 'hackerrank', 'skillrack']).withMessage('Invalid platform');

exports.linkPlatformValidator = [
  platformParamCheck,
  body('username').if(param('platform').isIn(['leetcode', 'hackerrank'])).notEmpty().withMessage('Username is required'),
  body('skillrack_id').if(param('platform').equals('skillrack')).notEmpty().withMessage('SkillRack id is required'),
  body('skillrack_key').if(param('platform').equals('skillrack')).notEmpty().withMessage('SkillRack key is required')
];

exports.refreshPlatformValidator = [
  platformParamCheck
];

exports.updatePlatformLinksValidator = [
  body('leetcode').optional().isString(),
  body('hackerrank').optional().isString(),
  body('skillrack').optional().isString()
];

exports.unlinkPlatformValidator = [
  platformParamCheck
];

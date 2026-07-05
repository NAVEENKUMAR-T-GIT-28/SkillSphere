const { body } = require('express-validator');

exports.updateSocialValidator = [
  body('github')
    .optional()
    .trim()
    .isURL().withMessage('GitHub must be a valid URL'),
  body('linkedin')
    .optional()
    .trim()
    .isURL().withMessage('LinkedIn must be a valid URL'),
  body('portfolio')
    .optional()
    .trim()
    .isURL().withMessage('Portfolio must be a valid URL'),
  body('leetcode')
    .optional()
    .trim(),
  body('hackerrank')
    .optional()
    .trim(),
  body('codechef')
    .optional()
    .trim(),
  body('codeforces')
    .optional()
    .trim(),
  body('skillrack')
    .optional()
    .trim()
];

const { body } = require('express-validator');

/**
 * Validate a Google Drive share link.
 * Must be HTTPS and from drive.google.com or docs.google.com.
 */
const driveLink = (fieldName) =>
  body(fieldName)
    .notEmpty().trim()
    .isURL({ protocols: ['https'], require_protocol: true })
    .withMessage(`${fieldName} must be a valid HTTPS URL`)
    .matches(/^https:\/\/(drive|docs)\.google\.com\//)
    .withMessage(`${fieldName} must be a Google Drive link (drive.google.com or docs.google.com)`);

/**
 * Validate an optional Google Drive link (allows null/empty).
 */
const optionalDriveLink = (fieldName) =>
  body(fieldName)
    .optional({ nullable: true, checkFalsy: true })
    .isURL({ protocols: ['https'], require_protocol: true })
    .withMessage(`${fieldName} must be a valid HTTPS URL`)
    .matches(/^https:\/\/(drive|docs)\.google\.com\//)
    .withMessage(`${fieldName} must be a Google Drive link`);

/**
 * Validate a generic HTTPS URL (GitHub, portfolio, etc.)
 */
const httpsUrl = (fieldName, required = true) => {
  const chain = body(fieldName);
  if (!required) chain.optional({ nullable: true, checkFalsy: true });
  return chain
    .isURL({ protocols: ['https'], require_protocol: true })
    .withMessage(`${fieldName} must be a valid HTTPS URL`);
};

module.exports = { driveLink, optionalDriveLink, httpsUrl };

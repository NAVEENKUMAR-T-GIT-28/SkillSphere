const sanitizeHtml = require('sanitize-html');

/**
 * Sanitizes input to remove any HTML tags, preventing XSS.
 * Can be used directly in express-validator `.customSanitizer(sanitizeField)`
 */
const sanitizeField = (value) => {
  if (typeof value !== 'string') return value;
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {}
  });
};

module.exports = { sanitizeField };

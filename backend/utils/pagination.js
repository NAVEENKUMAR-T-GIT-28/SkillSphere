/**
 * Shared pagination utilities
 */

/**
 * Calculates skip and parsed limit for database queries
 * @param {string|number} page - Current page number
 * @param {string|number} limit - Items per page
 * @returns {Object} { skip, limit, page }
 */
exports.paginate = (page = 1, limit = 20) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (parsedPage - 1) * parsedLimit;
  
  return { skip, limit: parsedLimit, page: parsedPage };
};

/**
 * Builds standard pagination metadata object
 * @param {number} total - Total number of documents matching filter
 * @param {string|number} page - Current page number
 * @param {string|number} limit - Items per page
 * @returns {Object} { total, page, limit, pages }
 */
exports.buildMeta = (total, page = 1, limit = 20) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 20);
  
  return {
    total,
    page: parsedPage,
    limit: parsedLimit,
    pages: Math.ceil(total / parsedLimit)
  };
};

/**
 * Standard response envelope for all API responses.
 * Ensures consistent JSON structure across the entire API.
 */

const success = (res, data, meta = {}, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
    error: null,
    meta
  });
};

const error = (res, message, statusCode = 400, code = null) => {
  res.status(statusCode).json({
    success: false,
    data: null,
    error: { message, code }
  });
};

module.exports = { success, error };

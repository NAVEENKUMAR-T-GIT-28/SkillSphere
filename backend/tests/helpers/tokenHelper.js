const jwt = require('jsonwebtoken');
const { getKeys } = require('../../utils/jwtKeys');

/**
 * Generate a real RS256 JWT for a given userId and role.
 */
const generateToken = (userId, baseRole) => {
  const { privateKey } = getKeys();
  return jwt.sign(
    { userId: userId.toString(), baseRole },
    privateKey,
    { algorithm: 'RS256', expiresIn: '1h' }
  );
};

module.exports = { generateToken };

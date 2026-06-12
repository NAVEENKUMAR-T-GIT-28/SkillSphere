const crypto = require('crypto');

const getKeys = () => {
  if (!process.env.JWT_PRIVATE_KEY_B64 || !process.env.JWT_PUBLIC_KEY_B64) {
    // For development, if keys are missing, generate them on the fly
    if (process.env.NODE_ENV !== 'production') {
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });
      process.env.JWT_PRIVATE_KEY_B64 = Buffer.from(privateKey).toString('base64');
      process.env.JWT_PUBLIC_KEY_B64 = Buffer.from(publicKey).toString('base64');
      console.warn('WARNING: Using dynamically generated RSA keys for JWT. Tokens will invalidate on restart. Set JWT_PRIVATE_KEY_B64 and JWT_PUBLIC_KEY_B64 in .env');
    } else {
      throw new Error('JWT RSA keys not configured. Set JWT_PRIVATE_KEY_B64 and JWT_PUBLIC_KEY_B64.');
    }
  }

  return {
    privateKey: Buffer.from(process.env.JWT_PRIVATE_KEY_B64, 'base64').toString('utf8'),
    publicKey: Buffer.from(process.env.JWT_PUBLIC_KEY_B64, 'base64').toString('utf8')
  };
};

module.exports = { getKeys };

const crypto = require('crypto');

module.exports = async () => {
  if (!process.env.JWT_PRIVATE_KEY_B64 || !process.env.JWT_PUBLIC_KEY_B64) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding:  { type: 'spki',  format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    process.env.JWT_PRIVATE_KEY_B64 = Buffer.from(privateKey).toString('base64');
    process.env.JWT_PUBLIC_KEY_B64  = Buffer.from(publicKey).toString('base64');
  }
};

// Disable MD5 check to bypass Windows corruption issues with mongodb-memory-server
process.env.MONGOMS_MD5_CHECK = '0';
const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI_TEST = mongod.getUri();
  global.__MONGOD__ = mongod;

  // Set test JWT keys — use simple symmetric secret for tests
  process.env.NODE_ENV = 'test';
  // jwtKeys.js will auto-generate RSA pair in non-production — that's fine
};

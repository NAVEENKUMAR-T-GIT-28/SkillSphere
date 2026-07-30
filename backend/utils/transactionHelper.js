const mongoose = require('mongoose');

// Determine if the current MongoDB connection supports transactions
const supportsTransactions = () => {
  try {
    const topology = mongoose.connection.client?.topology;
    if (!topology) return false;
    
    // Check modern topology descriptions (Mongoose 6+)
    const type = topology.description?.type || topology.type;
    if (typeof type === 'string') {
      return type.includes('ReplicaSet') || type === 'Sharded' || type === 'Mongos';
    }
    
    // Fallback heuristic for older drivers
    return !!(topology.s && topology.s.replicaSetId);
  } catch (err) {
    return false;
  }
};

const runInTransaction = async (callback, existingSession = null) => {
  if (existingSession) {
    return callback(existingSession);
  }
  
  if (!supportsTransactions()) {
    console.warn('⚠️ MongoDB Standalone detected. Executing without transaction.');
    return callback(undefined);
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    try {
      await session.abortTransaction();
    } catch (abortErr) {
      // Ignore abort errors
    }
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  runInTransaction,
  supportsTransactions
};

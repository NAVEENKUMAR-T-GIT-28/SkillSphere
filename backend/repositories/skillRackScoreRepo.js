const SkillRackScore = require('../models/SkillRackScore');

const findOne = (filter) => SkillRackScore.findOne(filter);
const updateOne = (filter, update, options) => SkillRackScore.updateOne(filter, update, options);
const create = (data) => SkillRackScore.create(data);
const findOneAndUpdate = (filter, update, options) => SkillRackScore.findOneAndUpdate(filter, update, options);
const findMany = (filter) => SkillRackScore.find(filter);
const count = (filter) => SkillRackScore.countDocuments(filter);
const aggregate = (pipeline) => SkillRackScore.aggregate(pipeline);
const bulkWrite = (operations, options) => SkillRackScore.bulkWrite(operations, options);

module.exports = {
  findOne,
  updateOne,
  create,
  findOneAndUpdate,
  findMany,
  find: findMany,
  count,
  countDocuments: count,
  aggregate,
  bulkWrite
};

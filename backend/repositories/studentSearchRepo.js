const StudentSearch = require('../models/StudentSearch');

const findOne = (filter) => StudentSearch.findOne(filter);
const updateOne = (filter, update, options) => StudentSearch.updateOne(filter, update, options);
const create = (data) => StudentSearch.create(data);
const findOneAndUpdate = (filter, update, options) => StudentSearch.findOneAndUpdate(filter, update, options);
const deleteOne = (filter) => StudentSearch.deleteOne(filter);

const findMany = (filter) => StudentSearch.find(filter);
const count = (filter) => StudentSearch.countDocuments(filter);

module.exports = {
  findOne,
  updateOne,
  create,
  findOneAndUpdate,
  deleteOne,
  findMany,
  find: findMany,
  count,
  countDocuments: count
};

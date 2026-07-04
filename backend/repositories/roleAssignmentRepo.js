const RoleAssignment = require('../models/RoleAssignment');

const findById = (id) => RoleAssignment.findById(id);
const findOne = (filter) => RoleAssignment.findOne(filter);
const create = (data) => RoleAssignment.create(data);
const deleteById = (id) => RoleAssignment.findByIdAndDelete(id);
const count = (filter) => RoleAssignment.countDocuments(filter);
const findMany = (filter) => RoleAssignment.find(filter);

module.exports = {
  findById,
  findOne,
  findMany,
  find: findMany,
  create,
  deleteById,
  count,
  countDocuments: count
};

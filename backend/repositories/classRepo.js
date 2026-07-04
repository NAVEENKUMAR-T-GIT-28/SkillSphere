const Class = require('../models/Class');

const findById = (id) => Class.findById(id);
const findOne = (filter) => Class.findOne(filter);
const findMany = (filter) => Class.find(filter);
const create = (data) => Class.create(data);
const updateById = (id, data) => Class.findByIdAndUpdate(id, data, { new: true });

module.exports = {
  findById,
  findOne,
  findMany,
  find: findMany,
  create,
  updateById
};

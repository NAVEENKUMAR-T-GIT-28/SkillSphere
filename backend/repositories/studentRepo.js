// repositories/studentRepo.js
const Student = require('../models/Student');

const findById = (id) => Student.findById(id).populate('user_id', '-password');
const findByIdWithSession = (id, session) => Student.findById(id, null, { session }).populate('user_id', '-password');

const findOne = (filter) => Student.findOne(filter);
const findOneWithSession = (filter, session) => Student.findOne(filter, null, { session });

const findByUserId = (userId) => Student.findOne({ user_id: userId });
const findMany = (filter = {}, projection = null, options = {}) => Student.find(filter, projection, options); // options are safe here for pagination

const create = (data) => Student.create(data);
const createWithSession = (data, session) => Student.create(Array.isArray(data) ? data : [data], { session }).then(res => Array.isArray(data) ? res : res[0]);

const updateById = (id, data) => Student.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const updateByIdWithSession = (id, data, session) => Student.findByIdAndUpdate(id, data, { new: true, runValidators: true, session });

const deleteById = (id) => Student.findByIdAndDelete(id);
const count = (filter = {}) => Student.countDocuments(filter);
const aggregate = (pipeline) => Student.aggregate(pipeline);

module.exports = {
  findById, findByIdWithSession, findOne, findOneWithSession, findByUserId, findMany, findAll: findMany, 
  create, createWithSession, 
  updateById, updateByIdWithSession, 
  deleteById, count, countDocuments: count, aggregate
};

// repositories/userRepo.js
const User = require('../models/User');

const findById = (id) => User.findById(id).select('-password');
const findByEmail = (email) => User.findOne({ email });
const findByEmailWithPassword = (email) => User.findOne({ email }).select('+password');
const create = (data) => User.create(data);
const updateById = (id, data) => User.findByIdAndUpdate(id, data, { new: true }).select('-password');
const updatePassword = (id, hashedPassword) => User.findByIdAndUpdate(id, { password: hashedPassword }, { new: true });

const findMany = (filter) => User.find(filter);

module.exports = { 
  findById, findByEmail, findByEmailWithPassword, findMany, find: findMany, create, updateById, updatePassword 
};

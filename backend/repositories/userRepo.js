// repositories/userRepo.js
const User = require('../models/User');

const findById = (id) => User.findById(id).select('-password');
const findByEmail = (email) => User.findOne({ email });
const findByEmailWithPassword = (email) => User.findOne({ email }).select('+password');
const findByLoginIdentifier = (login_identifier) => User.findOne({ login_identifier });
const findByLoginIdentifierWithPassword = (login_identifier) => User.findOne({ login_identifier }).select('+password');
const create = (data) => User.create(data);
const createWithSession = (data, session) => User.create(Array.isArray(data) ? data : [data], { session }).then(res => Array.isArray(data) ? res : res[0]);

const updateById = (id, data) => User.findByIdAndUpdate(id, data, { new: true }).select('-password');
const updateByIdWithSession = (id, data, session) => User.findByIdAndUpdate(id, data, { new: true, session }).select('-password');

const updatePassword = (id, hashedPassword) => User.findByIdAndUpdate(id, { password: hashedPassword }, { new: true });
const updatePasswordWithSession = (id, hashedPassword, session) => User.findByIdAndUpdate(id, { password: hashedPassword }, { new: true, session });

const findMany = (filter) => User.find(filter);

const deleteById = (id) => User.findByIdAndDelete(id);

module.exports = { 
  findById, findByEmail, findByEmailWithPassword, findByLoginIdentifier, findByLoginIdentifierWithPassword, findMany, find: findMany, 
  create, createWithSession, 
  updateById, updateByIdWithSession, 
  updatePassword, updatePasswordWithSession,
  deleteById
};

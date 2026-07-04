// repositories/facultyRepo.js
const Faculty = require('../models/Faculty');

const create = (data) => Faculty.create(data);
const findByUserId = (userId) => Faculty.findOne({ user_id: userId });
const findMany = (filter, skip = 0, limit = 50) => Faculty.find(filter).skip(skip).limit(limit).populate('user_id', 'email');

module.exports = { create, findByUserId, findMany, find: findMany };

// repositories/notificationRepo.js
const Notification = require('../models/Notification');


const create = (data) => Notification.create(data);
const insertMany = (docs) => Notification.insertMany(docs);
const markAllReadByUser = (userId) => Notification.updateMany({ user_id: userId, is_read: false }, { is_read: true });
const markReadById = (id, userId) => Notification.findOneAndUpdate({ _id: id, user_id: userId }, { is_read: true }, { new: true });
const deleteById = (id) => Notification.findByIdAndDelete(id);
const countDocuments = (filter = {}) => Notification.countDocuments(filter);
const deleteByReferenceId = (refId) => Notification.deleteMany({ reference_id: refId });

const findMany = (filter = {}, skip = 0, limit = 20) => Notification.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit);
const count = (filter = {}) => Notification.countDocuments(filter);

const findByUserId = (userId, filter = {}, skip = 0, limit = 20) => findMany({ user_id: userId, ...filter }, skip, limit);
const findUnreadByUserId = (userId) => findMany({ user_id: userId, is_read: false }, 0, 100);

module.exports = {
  findMany, count, countDocuments: count, create, insertMany, deleteById,
  findByUserId, findUnreadByUserId, markAllReadByUser, markReadById, deleteByReferenceId
};

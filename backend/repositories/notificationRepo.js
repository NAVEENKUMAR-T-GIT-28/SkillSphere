// repositories/notificationRepo.js
const Notification = require('../models/Notification');

const findByUserId = (userId, filter = {}, skip = 0, limit = 20) => 
  Notification.find({ user_id: userId, ...filter }).sort({ created_at: -1 }).skip(skip).limit(limit);
const findUnreadByUserId = (userId) => Notification.find({ user_id: userId, is_read: false }).sort({ created_at: -1 });
const create = (data) => Notification.create(data);
const insertMany = (docs) => Notification.insertMany(docs);
const markAllReadByUser = (userId) => Notification.updateMany({ user_id: userId, is_read: false }, { is_read: true });
const markReadById = (id, userId) => Notification.findOneAndUpdate({ _id: id, user_id: userId }, { is_read: true }, { new: true });
const deleteById = (id) => Notification.findByIdAndDelete(id);
const countDocuments = (filter = {}) => Notification.countDocuments(filter);
const deleteByReferenceId = (refId) => Notification.deleteMany({ reference_id: refId });

module.exports = {
  findByUserId, findUnreadByUserId,
  create, insertMany, markAllReadByUser, markReadById, deleteById, countDocuments, deleteByReferenceId
};

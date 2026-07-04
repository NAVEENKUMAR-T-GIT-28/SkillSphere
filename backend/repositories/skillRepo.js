// repositories/skillRepo.js
const Skill = require('../models/Skill');
const SkillTaxonomy = require('../models/SkillTaxonomy');

// ── Taxonomy ──────────────────────────────────────────────────────────────────
const findTaxonomyById = (id) => SkillTaxonomy.findById(id);
const findAllTaxonomy = (filter = {}) => SkillTaxonomy.find(filter);

// ── Student skills ─────────────────────────────────────────────────────────────
const findById = (id) => Skill.findById(id);
const findMany = (filter = {}, skip = 0, limit = 10) => Skill.find(filter).skip(skip).limit(limit);
const count = (filter = {}) => Skill.countDocuments(filter);

const findByStudentId = (studentId) => Skill.find({ student_id: studentId }).populate('taxonomy_id');
const findByStudentAndId = (studentId, id) => Skill.findOne({ _id: id, student_id: studentId });
const findByStudentAndTaxonomy = (studentId, taxonomyId) => Skill.findOne({ student_id: studentId, taxonomy_id: taxonomyId });
const findVerifiedByStudent = (studentId) => Skill.find({ student_id: studentId, status: 'verified' }).populate('taxonomy_id');
const create = (data) => Skill.create(data);
const updateById = (id, data) => Skill.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const updateStatus = (id, status, reviewerId) => Skill.findByIdAndUpdate(id, { status, verified_by: reviewerId, verified_at: new Date() }, { new: true });
const deleteById = (id) => Skill.findByIdAndDelete(id);
const findPending = (skip = 0, limit = 10) => findMany({ status: 'pending' }, skip, limit);
const aggregate = (pipeline) => Skill.aggregate(pipeline);

module.exports = {
  findTaxonomyById, findAllTaxonomy,
  findById, findByStudentId, findByStudentAndId, findByStudentAndTaxonomy, findVerifiedByStudent,
  create, updateById, updateStatus, deleteById,
  findPending, count, countDocuments: count, aggregate, findMany
};

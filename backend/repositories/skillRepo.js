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
const { resolveScopeToStudentFilter } = require('../utils/scopeResolver');

const deleteById = (id) => Skill.findByIdAndDelete(id);

const findPending = async (skip = 0, limit = 10, scope = null) => {
  const filter = { status: 'pending' };
  if (scope) {
    const studentFilter = await resolveScopeToStudentFilter(scope);
    if (studentFilter.student_id === null) return []; // Fast exit
    Object.assign(filter, studentFilter);
  }
  return Skill.find(filter)
    .skip(skip)
    .limit(limit)
    .populate('student_id', 'full_name roll_number department')
    .populate('taxonomy_id', 'category')
    .exec();
};
const countPending = async (scope = null) => {
  const filter = { status: 'pending' };
  if (scope) {
    const studentFilter = await resolveScopeToStudentFilter(scope);
    if (studentFilter.student_id === null) return 0;
    Object.assign(filter, studentFilter);
  }
  return count(filter);
};
const aggregate = (pipeline) => Skill.aggregate(pipeline);

module.exports = {
  findTaxonomyById, findAllTaxonomy,
  findById, findByStudentId, findByStudentAndId, findByStudentAndTaxonomy, findVerifiedByStudent,
  create, updateById, updateStatus, deleteById,
  findPending, countPending, count, countDocuments: count, aggregate, findMany
};

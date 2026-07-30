/**
 * services/search.js
 * Thin wrapper around StudentWorkspaceQueryService
 */

const StudentWorkspaceQueryService = require('./studentWorkspace/studentWorkspaceQuery.service');

const searchStudentsV2 = async (params) => {
  return await StudentWorkspaceQueryService.searchStudents(params);
};

module.exports = { searchStudentsV2 };

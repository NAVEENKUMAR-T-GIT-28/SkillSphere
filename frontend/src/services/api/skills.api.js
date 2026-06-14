import api from './api.client';
export const SkillsAPI = {
  getTaxonomy: () => api.get('/skill-taxonomy'),
  getSkills: (profileId) => api.get(`/students/${profileId}/skills`),
  addSkill: (profileId, payload) => api.post(`/students/${profileId}/skills`, payload),
  deleteSkill: (profileId, skillId) => api.delete(`/students/${profileId}/skills/${skillId}`),
};

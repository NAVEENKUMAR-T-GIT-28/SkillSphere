import api from './api.client';
export const ProjectsAPI = {
  getProjects: (profileId) => api.get(`/students/${profileId}/projects`),
  addProject: (profileId, payload) => api.post(`/students/${profileId}/projects`, payload),
  updateProject: (profileId, projectId, payload) => api.patch(`/students/${profileId}/projects/${projectId}`, payload),
  deleteProject: (profileId, projectId) => api.delete(`/students/${profileId}/projects/${projectId}`),
  updateFeature: (profileId, projectId, isFeatured) => api.patch(`/students/${profileId}/projects/${projectId}`, { is_featured: isFeatured }),
  rateProject: (projectId, rating) => api.post(`/projects/${projectId}/rate`, rating),
};

import api from './api.client';

export const InternshipsAPI = {
  getInternships: (profileId) => api.get(`/students/${profileId}/internships`),
  addInternship: (profileId, payload) => api.post(`/students/${profileId}/internships`, payload),
  updateInternship: (profileId, internshipId, payload) => api.patch(`/students/${profileId}/internships/${internshipId}`, payload),
  deleteInternship: (profileId, internshipId) => api.delete(`/students/${profileId}/internships/${internshipId}`),
};

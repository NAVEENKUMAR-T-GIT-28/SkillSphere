import api from './api.client';
export const ResumesAPI = {
  getResumes: (profileId) => api.get(`/students/${profileId}/resumes`),
  addResume: (profileId, payload) => api.post(`/students/${profileId}/resumes`, payload),
  deleteResume: (profileId, resumeId) => api.delete(`/students/${profileId}/resumes/${resumeId}`),
};

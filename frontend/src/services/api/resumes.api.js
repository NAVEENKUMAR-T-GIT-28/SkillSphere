import api from './api.client';
export const ResumesAPI = {
  getResumes: (profileId) => api.get(`/students/${profileId}/resumes`),
  addResume: (profileId, payload) => api.post(`/students/${profileId}/resumes`, payload),
  deleteResume: (profileId, resumeId) => api.delete(`/students/${profileId}/resumes/${resumeId}`),

  // ATS Engine (backend/ats/ — isolated module, same base resource)
  getAts: (profileId) => api.get(`/students/${profileId}/resumes/ats`),
  analyzeResume: (profileId, file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post(`/students/${profileId}/resumes/analyze`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  reanalyzeResume: (profileId) => api.post(`/students/${profileId}/resumes/reanalyze`),
};

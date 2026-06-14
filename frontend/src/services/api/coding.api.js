import api from './api.client';
export const CodingAPI = {
  getProfiles: (profileId) => api.get(`/students/${profileId}/coding-profiles`),
  addProfile: (profileId, payload) => api.post(`/students/${profileId}/coding-profiles`, payload),
  updateProfile: (profileId, profileIdDb, payload) => api.patch(`/students/${profileId}/coding-profiles/${profileIdDb}`, payload),
  deleteProfile: (profileId, profileIdDb) => api.delete(`/students/${profileId}/coding-profiles/${profileIdDb}`),
};

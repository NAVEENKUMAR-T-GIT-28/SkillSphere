import api from './api.client';

export const CodingAPI = {
  getCodingProfile: (profileId) => api.get(`/students/${profileId}/coding-profile`),
  linkPlatform: (profileId, platform, values) => api.post(`/students/${profileId}/coding-profile/${platform}/link`, values),
  refreshPlatform: (profileId, platform) => api.post(`/students/${profileId}/coding-profile/${platform}/refresh`),
  unlinkPlatform: (profileId, platform) => api.delete(`/students/${profileId}/coding-profile/${platform}`),
  updateCodingLinks: (profileId, links) => api.patch(`/students/${profileId}/coding-profile/links`, links),
};

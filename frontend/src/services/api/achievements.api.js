import api from './api.client';

export const AchievementsAPI = {
  getAchievements: (profileId) => api.get(`/students/${profileId}/achievements`),
  addAchievement: (profileId, payload) => api.post(`/students/${profileId}/achievements`, payload),
  updateAchievement: (profileId, achievementId, payload) => api.patch(`/students/${profileId}/achievements/${achievementId}`, payload),
  deleteAchievement: (profileId, achievementId) => api.delete(`/students/${profileId}/achievements/${achievementId}`),
};

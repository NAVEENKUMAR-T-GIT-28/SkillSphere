import api from './api.client';
export const AnalyticsAPI = {
  getStudentDashboard: () => api.get('/students/dashboard'),
  getHodDashboard: () => api.get('/hod/dashboard'),
};

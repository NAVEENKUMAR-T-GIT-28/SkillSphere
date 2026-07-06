import api from './api.client';
export const AnalyticsAPI = {
  getStudentDashboard: () => api.get('/my/dashboard'),
  getHodDashboard: () => api.get('/hod/dashboard'),
};

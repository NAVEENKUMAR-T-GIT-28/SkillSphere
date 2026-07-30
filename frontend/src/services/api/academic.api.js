import api from './api.client';
export const AcademicAPI = {
  getClasses: (params) => api.get('/classes', { params }),
  getClassById: (id) => api.get(`/classes/${id}`),
  createClass: (data) => api.post('/classes', data),
  updateClass: (id, data) => api.patch(`/classes/${id}`, data),
  deactivateClass: (id) => api.delete(`/classes/${id}`),
  promoteClass: (id) => api.patch(`/classes/${id}/promote`),
};

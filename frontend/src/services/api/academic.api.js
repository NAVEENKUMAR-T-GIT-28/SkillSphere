import api from './api.client';
export const AcademicAPI = {
  getClasses: () => api.get('/hod/classes'),
};

import api from './api.client';

export const EnrollmentAPI = {
  getClasses: (params = '') => api.get(`/hod/classes${params ? `?${params}` : ''}`),
  getStudents: (params = '') => api.get(`/hod/students${params ? `?${params}` : ''}`),
  getStudentById: (id) => api.get(`/hod/students/${id}`),
  createStudent: (payload) => api.post('/hod/students', payload),
  updateStudent: (id, payload) => api.patch(`/hod/students/${id}`, payload),
  changeClass: (id, payload) => api.patch(`/hod/students/${id}/class`, payload),
  changeStatus: (id, payload) => api.patch(`/hod/students/${id}/status`, payload),
  resetPassword: (id) => api.patch(`/hod/students/${id}/password-reset`, {})
};

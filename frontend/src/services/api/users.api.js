import api from './api.client';
export const UsersAPI = {
  getProfile: (id) => api.get(`/students/${id}/profile`),
  updateProfile: (id, payload) => api.patch(`/students/${id}/profile`, payload),
  searchStudents: (params) => api.get(`/search/students?${params}`),
  searchUsers: (query, role, limit=10) => api.get(`/hod/users?search=${encodeURIComponent(query)}&role=${role}&limit=${limit}`),
  getMentees: () => api.get('/my/mentees'),
  createHod: (payload) => api.post('/admin/create-hod', payload),
};

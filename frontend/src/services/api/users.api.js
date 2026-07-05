import api from './api.client';
export const UsersAPI = {
  getProfile: (id) => api.get(`/v1/student/profile${id ? `?studentId=${id}` : ''}`),
  updateProfileBasic: (payload) => api.patch(`/v1/student/profile/basic`, payload),
  updateProfileAcademic: (payload) => api.patch(`/v1/student/profile/academic`, payload),
  updateProfileCareer: (payload) => api.patch(`/v1/student/profile/career`, payload),
  updateProfileSocial: (payload) => api.patch(`/v1/student/profile/social`, payload),
  searchStudents: (params) => api.get(`/search/students?${params}`),
  searchStudentsV2: (params) => api.get(`/search/v2/students?${params}`),
  searchUsers: (query, role, limit=10) => api.get(`/hod/users?search=${encodeURIComponent(query)}&role=${role}&limit=${limit}`),
  getMentees: () => api.get('/my/mentees'),
  createHod: (payload) => api.post('/admin/create-hod', payload),
};

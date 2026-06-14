import api from './api.client';
export const RolesAPI = {
  getAssignments: () => api.get('/hod/role-assignments'),
  assignRole: (payload) => api.post('/hod/role-assignments', payload),
  removeAssignment: (id) => api.delete(`/hod/role-assignments/${id}`),
};

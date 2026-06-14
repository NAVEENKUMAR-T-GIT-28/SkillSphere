import api from './api.client';
export const VerificationAPI = {
  getQueue: () => api.get('/verification/queue'),
  approveItem: (type, id) => api.post(`/verification/${type}/${id}/approve`),
  rejectItem: (type, id, reason) => api.post(`/verification/${type}/${id}/reject`, { reason }),
};

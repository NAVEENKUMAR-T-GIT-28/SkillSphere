import api from './api.client';
export const DrivesAPI = {
  getDrives: (limit=0) => api.get(limit ? `/placement-drives?limit=${limit}` : '/placement-drives'),
  getStudentApplications: (profileId) => api.get(`/students/${profileId}/applications`),
  applyForDrive: (driveId) => api.post(`/placement-drives/${driveId}/apply`),
  createDrive: (payload) => api.post('/placement-drives', payload),
  deleteDrive: (driveId) => api.delete(`/placement-drives/${driveId}`),
  getShortlist: (driveId) => api.get(`/placement-drives/${driveId}/shortlist`),
};

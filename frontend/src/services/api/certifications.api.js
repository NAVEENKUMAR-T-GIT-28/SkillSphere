import api from './api.client';
export const CertificationsAPI = {
  getCertifications: (profileId) => api.get(`/students/${profileId}/certifications`),
  addCertification: (profileId, payload) => api.post(`/students/${profileId}/certifications`, payload),
  deleteCertification: (profileId, certId) => api.delete(`/students/${profileId}/certifications/${certId}`),
};

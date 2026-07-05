import api from './api.client';
export const CertificationsAPI = {
  getCertifications: (profileId) => api.get(`/students/${profileId}/certifications`),
  addCertification: (profileId, payload) => api.post(`/students/${profileId}/certifications`, payload),
  updateCertification: (profileId, certId, payload) => api.patch(`/students/${profileId}/certifications/${certId}`, payload),
  deleteCertification: (profileId, certId) => api.delete(`/students/${profileId}/certifications/${certId}`),
};

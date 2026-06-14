import api from './api.client';
export const AuthAPI = {
  login: (payload) => api.post('/auth/login', payload),
};

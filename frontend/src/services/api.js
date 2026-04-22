import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  signin: (data) => api.post('/auth/signin', data),
  getMe: () => api.get('/auth/me'),
};

export const vehiclesAPI = {
  getAll: () => api.get('/vehicles'),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const parentsAPI = {
  getAll: () => api.get('/parents'),
  create: (data) => api.post('/parents', data),
  update: (id, data) => api.put(`/parents/${id}`, data),
  delete: (id) => api.delete(`/parents/${id}`),
  createStudent: (parentId, data) => api.post(`/parents/${parentId}/students`, data),
  updateStudent: (id, data) => api.put(`/parents/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/parents/students/${id}`),
};

export const paymentsAPI = {
  getAll: () => api.get('/payments'),
  create: (data) => api.post('/payments', data),
  markAsPaid: (id, data) => api.put(`/payments/${id}/mark-paid`, data),
  recordPartialPayment: (id, data) => api.put(`/payments/${id}/partial-payment`, data),
  delete: (id) => api.delete(`/payments/${id}`),
  generateMonthly: (month, data) => api.post(`/payments/generate/${month}`, data),
};

export const complianceAPI = {
  getAll: () => api.get('/compliance'),
  create: (data) => api.post('/compliance', data),
  update: (id, data) => api.put(`/compliance/${id}`, data),
  delete: (id) => api.delete(`/compliance/${id}`),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

export const expensesAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getSummary: (year) => api.get('/expenses/summary', { params: { year } }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

export const financeAPI = {
  getBalanceSheet: () => api.get('/finance/balance-sheet'),
  getProfitAndLoss: (year) => api.get('/finance/profit-loss', { params: { year } }),
  getFinancialSummary: () => api.get('/finance/summary'),
};

const adminApi = axios.create({ baseURL: API_URL });

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/signin';
    }
    return Promise.reject(error);
  }
);

export const adminAPI = {
  signin: (data) => adminApi.post('/admin/signin', data),
  getMe: () => adminApi.get('/admin/me'),
  getOperators: () => adminApi.get('/admin/operators'),
  getOperatorDetail: (id) => adminApi.get(`/admin/operators/${id}`),
  freezeOperator: (id) => adminApi.patch(`/admin/operators/${id}/freeze`),
  unfreezeOperator: (id) => adminApi.patch(`/admin/operators/${id}/unfreeze`),
  updatePermissions: (id, data) => adminApi.patch(`/admin/operators/${id}/permissions`, data),
  deleteOperator: (id) => adminApi.delete(`/admin/operators/${id}`),
};

export default api;

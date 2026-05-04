// src/api.js — All HTTP calls to the backend

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

export const authAPI = {
  login:    (email, password) =>
    request('/api/auth/login',    { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name, email, password) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  me: () => request('/api/auth/me'),
  updateProfile: (name) =>
    request('/api/auth/profile', { method: 'PUT', body: JSON.stringify({ name }) }),
  changePassword: (currentPassword, newPassword) =>
    request('/api/auth/profile/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),
};

export const simAPI = {
  run:       (formData) =>
    request('/api/simulate',              { method: 'POST', body: JSON.stringify(formData) }),
  myHistory: (page = 1, limit = 10) =>
    request(`/api/simulate/my?page=${page}&limit=${limit}`),
  getOne:    (id) => request(`/api/simulate/${id}`),
  deleteOne: (id) => request(`/api/simulate/${id}`, { method: 'DELETE' }),
};

export const adminAPI = {
  stats:       () => request('/api/admin/stats'),
  users:       () => request('/api/admin/users'),
  addUser:     (data) =>
    request('/api/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  toggleUser:  (id) =>
    request(`/api/admin/users/${id}/toggle`, { method: 'PATCH' }),
  deleteUser:  (id) =>
    request(`/api/admin/users/${id}`, { method: 'DELETE' }),
  simulations: (page = 1, limit = 20, userId = null) =>
    request(`/api/admin/simulations?page=${page}&limit=${limit}${userId ? `&user_id=${userId}` : ''}`),
  logs:        (limit = 50) =>
    request(`/api/admin/logs?limit=${limit}`),
};

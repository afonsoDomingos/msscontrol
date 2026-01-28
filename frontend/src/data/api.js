
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const handleResponse = async (res, endpoint) => {
  if (!res.ok) {
    if (res.status === 401) {
      console.warn('Sessão expirada ou inválida. Redirecionando...');
      localStorage.removeItem('token');
      // Use window.location as fallback, but avoid loop
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return null;
    }
    console.error(`Erro na API (${res.status}):`, endpoint);
    throw new Error('API Request Failed');
  }
  return res.json();
};

export const api = {
  get: async (endpoint) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${endpoint}`, { headers });
    return handleResponse(res, endpoint);
  },

  post: async (endpoint, body) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    return handleResponse(res, endpoint);
  },

  put: async (endpoint, body) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });
    return handleResponse(res, endpoint);
  },

  delete: async (endpoint) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers
    });
    return handleResponse(res, endpoint);
  },

  upload: async (endpoint, formData) => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData
    });
    return handleResponse(res, endpoint);
  }
};

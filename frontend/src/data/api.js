
const API_URL = 'http://localhost:5000/api';

export const api = {
  get: async (endpoint) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${endpoint}`, { headers });
    if (!res.ok) {
        if (res.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        throw new Error('API Request Failed');
    }
    return res.json();
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
    if (!res.ok) throw new Error('API Request Failed');
    return res.json();
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
    if (!res.ok) throw new Error('API Request Failed');
    return res.json();
  },

  delete: async (endpoint) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error('API Request Failed');
    return res.json();
  }
};

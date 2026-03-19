/* ===== api.js - All API calls to backend ===== */

const API_BASE = 'http://localhost:5000/api';

async function apiCall(endpoint, options = {}) {
  const defaults = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  const config = { ...defaults, ...options, headers: { ...defaults.headers, ...(options.headers || {}) } };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    console.error('API Error:', err);
    return { ok: false, status: 0, data: { success: false, message: 'Network error. Please check your connection.' } };
  }
}

// ── Auth API ──────────────────────────────────────────────────
const AuthAPI = {
  register: (payload) => apiCall('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => apiCall('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => apiCall('/auth/logout', { method: 'POST' }),
  check: () => apiCall('/auth/check'),
  getProfile: () => apiCall('/auth/profile'),
  updateProfile: (payload) => apiCall('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),
};

// ── Chat API ──────────────────────────────────────────────────
const ChatAPI = {
  send: (message) => apiCall('/chat/send', { method: 'POST', body: JSON.stringify({ message }) }),
  getHistory: (limit = 50) => apiCall(`/chat/history?limit=${limit}`),
  clear: () => apiCall('/chat/clear', { method: 'DELETE' }),
};

// ── FAQ API ───────────────────────────────────────────────────
const FAQAPI = {
  getAll: (page = 1, perPage = 20, category = '', search = '') => {
    const params = new URLSearchParams({ page, per_page: perPage });
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    return apiCall(`/faqs/?${params}`);
  },
  getById: (id) => apiCall(`/faqs/${id}`),
  getCategories: () => apiCall('/faqs/categories'),
};

// ── Inquiry API ───────────────────────────────────────────────
const InquiryAPI = {
  submit: (payload) => apiCall('/inquiries/', { method: 'POST', body: JSON.stringify(payload) }),
  getAll: (page = 1) => apiCall(`/inquiries/?page=${page}`),
  getById: (id) => apiCall(`/inquiries/${id}`),
};

// ── Admin API ─────────────────────────────────────────────────
const AdminAPI = {
  login: (payload) => apiCall('/admin/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => apiCall('/admin/logout', { method: 'POST' }),
  check: () => apiCall('/admin/check'),
  getDashboard: () => apiCall('/admin/dashboard'),

  getFaqs: (page = 1) => apiCall(`/admin/faqs?page=${page}`),
  createFaq: (payload) => apiCall('/admin/faqs', { method: 'POST', body: JSON.stringify(payload) }),
  updateFaq: (id, payload) => apiCall(`/admin/faqs/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteFaq: (id) => apiCall(`/admin/faqs/${id}`, { method: 'DELETE' }),

  getInquiries: (page = 1) => apiCall(`/admin/inquiries?page=${page}`),
  updateInquiry: (id, payload) => apiCall(`/admin/inquiries/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  getUsers: (page = 1) => apiCall(`/admin/users?page=${page}`),

  getResponses: () => apiCall('/admin/responses'),
  createResponse: (payload) => apiCall('/admin/responses', { method: 'POST', body: JSON.stringify(payload) }),
  updateResponse: (id, payload) => apiCall(`/admin/responses/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteResponse: (id) => apiCall(`/admin/responses/${id}`, { method: 'DELETE' }),
};

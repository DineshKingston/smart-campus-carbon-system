import axios from 'axios'

// In dev:        VITE_API_URL is not set → uses '/api' (Vite proxy → localhost:8080)
// In production: VITE_API_URL = 'https://your-backend.up.railway.app/api'
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
}

// ── Emissions ─────────────────────────────────────────────────────
export const emissionAPI = {
  getAll:      ()           => api.get('/emissions'),
  add:         (data)       => api.post('/emissions', data),
  delete:      (id)         => api.delete(`/emissions/${id}`),
  categories:  ()           => api.get('/emissions/categories'),
  upload:      (file)       => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/emissions/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}

// ── Predictions (all via Spring Boot proxy — never Flask directly) ─
export const predictionAPI = {
  health:      ()           => api.get('/predictions/health'),
  forecast:    (month)      => api.get('/predictions/forecast', { params: { month } }),
  history:     ()           => api.get('/predictions/history'),
}

// ── Dashboard ─────────────────────────────────────────────────────
export const dashboardAPI = {
  summary:     ()           => api.get('/dashboard/summary'),
}

// ── Admin (ADMIN role only) ────────────────────────────────────────
export const adminAPI = {
  listUsers:   ()           => api.get('/admin/users'),
  createUser:  (data)       => api.post('/admin/users', data),
  deleteUser:  (id)         => api.delete(`/admin/users/${id}`),
}

export default api

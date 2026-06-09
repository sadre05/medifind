import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: BASE })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('mf_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export const authAPI = {
  registerUser: (d) => api.post('/api/auth/user/register', d),
  loginUser: (d) => api.post('/api/auth/user/login', d),
}

export const requestAPI = {
  create: (d) => api.post('/api/requests/', d),
  getResponses: (id) => api.get(`/api/requests/${id}/responses`),
  getMyRequests: () => api.get('/api/requests/my/all'),
}

export const prescriptionAPI = {
  upload: (formData) => api.post('/api/prescriptions/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

export const locationAPI = {
  updateUserLocation: (lat, lng) => api.patch('/api/shops/user/location', { latitude: lat, longitude: lng }),
}

export default api

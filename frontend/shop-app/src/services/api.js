import axios from "axios"
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"
const api = axios.create({ baseURL: BASE })
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("mf_shop_token")
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})
export const authAPI = {
  registerShop: (d) => api.post("/api/auth/shop/register", d),
  loginShop: (d) => api.post("/api/auth/shop/login", d),
}
export const shopAPI = {
  getProfile: () => api.get("/api/shops/me"),
  toggleStatus: () => api.patch("/api/shops/status"),
  updateLocation: (lat, lng) => api.patch("/api/shops/location", { latitude: lat, longitude: lng }),
}
export const requestAPI = {
  getIncoming: () => api.get("/api/requests/shop/incoming"),
  respond: (request_id, shop_id, response, available_medicines) =>
    api.post("/api/requests/shop/respond", { request_id, shop_id, response, available_medicines }),
  getHistory: () => api.get("/api/requests/shop/history"),
}
export default api

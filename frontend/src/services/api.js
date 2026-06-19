import axios from 'axios'
import { clearAuthSession, getStoredToken } from './authSession.js'

let isRedirectingAfterUnauthorized = false

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const authHeader = error.config?.headers?.Authorization || error.config?.headers?.authorization

    if (status === 401 && authHeader && !isRedirectingAfterUnauthorized) {
      isRedirectingAfterUnauthorized = true
      clearAuthSession()

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.replace('/login')
      }
    }

    return Promise.reject(error)
  },
)

export default api

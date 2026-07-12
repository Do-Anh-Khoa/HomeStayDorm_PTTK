import api from './api.js'

export async function fetchPhuTrachDashboard() {
  const { data } = await api.get('/phu-trach-dashboard')
  return data
}
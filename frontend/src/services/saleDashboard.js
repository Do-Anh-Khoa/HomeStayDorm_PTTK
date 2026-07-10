import api from './api.js'

export async function fetchSaleDashboard() {
  const { data } = await api.get('/sale-dashboard')
  return data
}

import api from './api.js'

export async function fetchHoSoDangKyFormOptions() {
  const { data } = await api.get('/ho-so-dang-ky/form-options')
  return data
}

export async function createHoSoDangKy(payload) {
  const { data } = await api.post('/ho-so-dang-ky', payload)
  return data
}

export async function fetchHoSoDangKyList(params = {}) {
  const { data } = await api.get('/ho-so-dang-ky', { params })
  return data
}

export async function fetchHoSoDangKyDetail(maDk) {
  const { data } = await api.get(`/ho-so-dang-ky/${maDk}`)
  return data
}

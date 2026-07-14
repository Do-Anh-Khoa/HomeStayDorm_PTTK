import api from './api.js'

export async function searchReturnProfiles(keyword) {
  const { data } = await api.get('/ho-so-tra-phong/search', {
    params: { keyword },
  })
  return data?.data || []
}

export async function createReturnProfile(payload) {
  const { data } = await api.post('/ho-so-tra-phong', payload)
  return data?.data || null
}

export async function fetchReturnProfileList() {
  const { data } = await api.get('/ho-so-tra-phong')
  return data?.data || []
}

export async function fetchReturnProfileDetail(maTP) {
  const { data } = await api.get(`/ho-so-tra-phong/${maTP}`)
  return data?.data || null
}

export async function cancelReturnProfile(maTP) {
  const { data } = await api.post(`/ho-so-tra-phong/${maTP}/huy`)
  return data?.data || false
}


import api from './api.js'

export async function fetchPendingContracts(params = {}) {
  const { data } = await api.get('/hop-dong-thue/cho-xu-ly', { params })
  return data?.data || []
}

export async function fetchCreatedContractsToday() {
  const { data } = await api.get('/hop-dong-thue/da-lap-hom-nay')
  return data?.data || []
}

export async function fetchContractDraft(maPDC) {
  const { data } = await api.get(`/hop-dong-thue/lap/${maPDC}`)
  return data?.data || null
}

export async function previewContract(payload) {
  const { data } = await api.post('/hop-dong-thue/xem-truoc', payload)
  return data?.data || null
}

export async function createContract(payload) {
  const { data } = await api.post('/hop-dong-thue/lap', payload)
  return data?.data || null
}

export async function fetchContractDetail(maHDT) {
  const { data } = await api.get(`/hop-dong-thue/${maHDT}`)
  return data?.data || null
}

export async function downloadContractPdf(maHDT) {
  const response = await api.get(`/hop-dong-thue/${maHDT}/pdf`, {
    responseType: 'blob',
  })

  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${maHDT}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

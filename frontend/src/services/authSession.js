const AUTH_STORAGE_KEYS = ['token', 'role', 'user']

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return atob(padded)
}

export function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token') || ''
}

export function getTokenPayload(token = getStoredToken()) {
  if (!token) return null

  try {
    const [, payload] = token.split('.')
    if (!payload) return null

    return JSON.parse(decodeBase64Url(payload))
  } catch {
    return null
  }
}

export function getTokenExpiryMs(token = getStoredToken()) {
  const payload = getTokenPayload(token)

  if (!payload?.exp) {
    return 0
  }

  return payload.exp * 1000
}

export function isTokenExpired(token = getStoredToken()) {
  const expiresAt = getTokenExpiryMs(token)

  if (!token || !expiresAt) {
    return true
  }

  return expiresAt <= Date.now()
}

export function getStoredRole() {
  const token = getStoredToken()
  if (!token) return ''

  if (isTokenExpired(token)) {
    clearAuthSession()
    return ''
  }

  return localStorage.getItem('role') || sessionStorage.getItem('role') || ''
}

export function clearAuthSession() {
  for (const key of AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  }
}

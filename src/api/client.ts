import { getCsrfToken, saveCsrfToken, clearAuthData, getAuthToken, saveAuthToken, getRefreshToken, saveRefreshToken } from '../utils/authStorage'
import { globalHandlers } from '../utils/globalHandlers'

export const API_BASE_URL = 'https://7qmg64nu2z.ap-south-1.awsapprunner.com'
// Allow overriding the backend base URL via env (useful when proxying isn't working
// or when pointing to a local backend).
// - Dev default: '' (Vite proxy)
// - Prod default: API_BASE_URL
const ENV_BASE = String(import.meta.env.VITE_API_BASE_URL ?? '').trim()
const BASE_URL = ENV_BASE
  ? ENV_BASE.replace(/\/+$/, '')
  : (import.meta.env.DEV ? '' : API_BASE_URL)
const API_TIMEOUT = 30000

let isRefreshing = false
let refreshPromise: Promise<void> | null = null

function extractCsrfFromResponse(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  return (
    (d.csrf_token as string) ||
    (d.csrfToken as string) ||
    ((d.data as Record<string, unknown>)?.csrf_token as string) ||
    ((d.data as Record<string, unknown>)?.csrfToken as string) ||
    null
  )
}

function extractAccessTokenFromResponse(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  const inner = d.data
  const innerRec = inner != null && typeof inner === 'object' && !Array.isArray(inner) ? (inner as Record<string, unknown>) : null
  const candidates = [
    d.access_token,
    d.accessToken,
    d.token,
    innerRec?.access_token,
    innerRec?.accessToken,
    innerRec?.token,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
  }
  return null
}

function extractRefreshTokenFromResponse(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  const inner = d.data
  const innerRec = inner != null && typeof inner === 'object' && !Array.isArray(inner) ? (inner as Record<string, unknown>) : null
  const candidates = [
    d.refresh_token,
    d.refreshToken,
    innerRec?.refresh_token,
    innerRec?.refreshToken,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
  }
  return null
}

function applyBearerHeader(headers: Record<string, string>): void {
  const t = getAuthToken()
  if (t?.trim()) headers.Authorization = `Bearer ${t.trim()}`
}

async function refreshAuthToken(): Promise<void> {
  if (isRefreshing && refreshPromise) return refreshPromise

  isRefreshing = true
  refreshPromise = (async (): Promise<void> => {
    try {
      const csrfToken = getCsrfToken()
      const baseHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }
      if (csrfToken) baseHeaders['X-CSRF-Token'] = csrfToken

      // Prefer the stored refresh token when available. Sending an empty cookie
      // refresh first creates avoidable 401s and can trip backend rate limits.
      const rt = getRefreshToken()
      const attempts: Array<{ body?: string }> = []
      if (rt?.trim()) {
        attempts.push({ body: JSON.stringify({ refresh_token: rt.trim() }) })
      } else {
        attempts.push({ body: undefined })
      }

      let lastMessage = 'Token refresh failed'
      let hitRateLimit = false
      for (const { body } of attempts) {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { ...baseHeaders },
          credentials: 'include',
          body,
        })
        const ct = res.headers.get('content-type')
        const responseData: unknown = ct?.includes('application/json') ? await res.json() : await res.text()

        if (res.ok) {
          const newAccess = extractAccessTokenFromResponse(responseData)
          if (newAccess) saveAuthToken(newAccess)
          const newRefresh = extractRefreshTokenFromResponse(responseData)
          if (newRefresh) saveRefreshToken(newRefresh)
          const newCsrf = extractCsrfFromResponse(responseData)
          if (newCsrf) saveCsrfToken(newCsrf)
          return
        }
        if (res.status === 429) hitRateLimit = true
        if (typeof responseData === 'object' && responseData && 'message' in responseData) {
          const m = (responseData as { message?: unknown }).message
          if (typeof m === 'string' && m.trim()) lastMessage = m.trim()
        }
      }

      // 429 means rate-limited, not invalid — keep existing tokens so the user
      // stays authenticated and the next request can retry normally.
      if (!hitRateLimit) {
        clearAuthData()
        globalHandlers.handleUnauthorized()
      }
      throw new Error(lastMessage)
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function refreshAuthIfNeeded(): Promise<void> {
  // Public wrapper for proactive refresh scheduling.
  return refreshAuthToken()
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const csrfToken = getCsrfToken()
  const method = (options.method || 'GET').toUpperCase()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken
  applyBearerHeader(headers)

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (options.body instanceof FormData) {
    delete headers['Content-Type']
  }

  const body = options.body instanceof FormData
    ? options.body
    : options.body
      ? JSON.stringify(options.body)
      : undefined

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)
  const signal = options.signal || controller.signal

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      method,
      headers,
      body,
      credentials: 'include',
      signal,
    })
    clearTimeout(timeoutId)

    const ct = res.headers.get('content-type')
    let data: T
    if (ct?.includes('application/json')) {
      data = await res.json() as T
    } else {
      const text = await res.text()
      try { data = JSON.parse(text) as T } catch { data = text as unknown as T }
    }

    const newCsrf = extractCsrfFromResponse(data)
    if (newCsrf) saveCsrfToken(newCsrf)

    if (!res.ok) {
      const isRefreshEndpoint = path.includes('/auth/refresh')
      const isLogoutEndpoint = path.includes('/auth/logout')

      if (res.status === 401 && !isRefreshEndpoint && !isLogoutEndpoint) {
        try {
          await refreshAuthToken()
          const retryHeaders: Record<string, string> = { ...headers }
          const csrfAfter = getCsrfToken()
          if (csrfAfter) retryHeaders['X-CSRF-Token'] = csrfAfter
          applyBearerHeader(retryHeaders)
          if (options.body instanceof FormData) delete retryHeaders['Content-Type']

          const retryRes = await fetch(`${BASE_URL}${path}`, {
            ...options,
            method,
            headers: retryHeaders,
            body,
            credentials: 'include',
          })
          const retryData: T = retryRes.headers.get('content-type')?.includes('application/json')
            ? await retryRes.json()
            : await retryRes.text() as unknown as T
          const retryCsrf = extractCsrfFromResponse(retryData)
          if (retryCsrf) saveCsrfToken(retryCsrf)
          if (!retryRes.ok) throw { response: { status: retryRes.status, data: retryData }, message: (retryData as any)?.message || `Request failed ${retryRes.status}` }
          return retryData
        } catch (refreshErr: any) {
          if (refreshErr?.response) throw refreshErr
        }
      }

      const err: any = new Error((data as any)?.message || `API error ${res.status}: ${path}`)
      err.status = res.status
      err.data = data
      err.response = { status: res.status, data }
      throw err
    }

    return data
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      const err: any = new Error('Request timeout')
      err.code = 'TIMEOUT'
      throw err
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const err: any = new Error('Network error - no response received')
      err.code = 'NETWORK_ERROR'
      throw err
    }
    throw error
  }
}

async function requestBlob(path: string, options: RequestInit = {}): Promise<Blob> {
  const csrfToken = getCsrfToken()
  const headers: Record<string, string> = {
    Accept: 'application/pdf',
    ...(options.headers as Record<string, string>),
  }
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken
  applyBearerHeader(headers)

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })
  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    const err: any = new Error(`API error ${res.status}: ${path}`)
    err.status = res.status
    try { err.data = JSON.parse(errBody) } catch { err.data = errBody }
    throw err
  }
  return res.blob()
}

export const api = {
  get:     <T>(path: string)                  => request<T>(path),
  post:    <T>(path: string, body: unknown)   => request<T>(path, { method: 'POST',   body: body as BodyInit }),
  put:     <T>(path: string, body: unknown)   => request<T>(path, { method: 'PUT',    body: body as BodyInit }),
  patch:   <T>(path: string, body: unknown)   => request<T>(path, { method: 'PATCH',  body: body as BodyInit }),
  delete:  <T>(path: string)                  => request<T>(path, { method: 'DELETE' }),
  getBlob: (path: string)                     => requestBlob(path),
}

import { DEV_TOKEN } from '../config/auth'

export const API_BASE_URL = 'https://7qmg64nu2z.ap-south-1.awsapprunner.com'
const BASE_URL = API_BASE_URL

/**
 * When integrated into the main website, replace DEV_TOKEN with
 * the token extracted from the main website's JWT.
 */
function getToken(): string {
  return DEV_TOKEN
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const errBody = await res.text()
    console.error(`API ${res.status} ${path}:`, errBody)
    const err: any = new Error(`API error ${res.status}: ${path}`)
    err.status = res.status
    try { err.data = JSON.parse(errBody) } catch { err.data = errBody }
    throw err
  }
  if (res.status === 204 || res.status === 205) return {} as T
  const text = await res.text()
  if (!text.trim()) return {} as T
  try {
    return JSON.parse(text) as T
  } catch {
    return {} as T
  }
}

async function requestBlob(path: string, options?: RequestInit): Promise<Blob> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Accept': 'application/pdf',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    console.error(`API ${res.status} ${path}:`, errBody)
    const err: any = new Error(`API error ${res.status}: ${path}`)
    err.status = res.status
    try { err.data = JSON.parse(errBody) } catch { err.data = errBody }
    throw err
  }
  return await res.blob()
}

export const api = {
  get:    <T>(path: string)                  => request<T>(path),
  post:   <T>(path: string, body: unknown)   => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)   => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: <T>(path: string)                  => request<T>(path, { method: 'DELETE' }),
  getBlob: (path: string)                    => requestBlob(path),
}

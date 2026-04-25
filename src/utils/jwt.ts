export function jwtExpMs(token: string | null | undefined): number | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null

  // base64url decode
  let payload = parts[1]!
  payload = payload.replace(/-/g, '+').replace(/_/g, '/')
  const pad = payload.length % 4
  if (pad) payload += '='.repeat(4 - pad)

  try {
    const json = atob(payload)
    const data = JSON.parse(json) as { exp?: unknown }
    const expSec = typeof data.exp === 'number' ? data.exp : Number(data.exp)
    if (!Number.isFinite(expSec) || expSec <= 0) return null
    return expSec * 1000
  } catch {
    return null
  }
}


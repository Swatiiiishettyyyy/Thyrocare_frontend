const SESSION_KEY = 'nucleotide_utm_v1'
const FIRED_KEY   = 'nucleotide_utm_fired_v1'

export interface UtmParams {
  utm_source:   string | null
  utm_medium:   string | null
  utm_campaign: string | null
  utm_term:     string | null
  utm_content:  string | null
}

export function readUtmFromUrl(): UtmParams {
  const p = new URLSearchParams(window.location.search)
  return {
    utm_source:   p.get('utm_source'),
    utm_medium:   p.get('utm_medium'),
    utm_campaign: p.get('utm_campaign'),
    utm_term:     p.get('utm_term'),
    utm_content:  p.get('utm_content'),
  }
}

export function hasUtmParams(u: UtmParams): boolean {
  return !!(u.utm_source || u.utm_medium || u.utm_campaign || u.utm_term || u.utm_content)
}

export function saveUtmToSession(u: UtmParams): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(u))
}

export function getUtmFromSession(): UtmParams | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as UtmParams) : null
  } catch { return null }
}

export function markUtmFired(): void {
  sessionStorage.setItem(FIRED_KEY, '1')
}

export function wasUtmFired(): boolean {
  return sessionStorage.getItem(FIRED_KEY) === '1'
}

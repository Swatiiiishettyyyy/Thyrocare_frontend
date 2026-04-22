/**
 * Mapbox Geocoding API (forward autocomplete + reverse).
 * Set `VITE_MAPBOX_ACCESS_TOKEN` in `.env` (public token with URL restrictions).
 * Session UUID is generated in UI for parity with Mapbox Search Box billing; v5 Geocoding bills per request.
 */

const GEOCODE_BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places'

/** Mapbox rejects reverse queries when coordinates exceed 8 decimal places (422). */
const MAPBOX_COORD_DECIMALS = 8

function formatCoordForMapbox(n: number): string {
  if (!Number.isFinite(n)) return '0'
  return Number(n.toFixed(MAPBOX_COORD_DECIMALS)).toString()
}

/** `{lng},{lat}` for reverse path — literal comma, no encodeURIComponent on the pair. */
function reverseGeocodePathSegment(lng: number, lat: number): string {
  return `${formatCoordForMapbox(lng)},${formatCoordForMapbox(lat)}`
}

export function getMapboxAccessToken(): string | null {
  let t = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
  if (typeof t !== 'string') return null
  t = t.replace(/^\uFEFF/, '').trim().replace(/^["']|["']$/g, '')
  return t || null
}

/** Short message for UI when forward geocode fails. */
export function mapboxGeocodeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message
    if (/401|Unauthorized|not\s*authorized/i.test(m)) return 'Invalid or expired Mapbox token (use a public pk. token).'
    if (/403|Forbidden/i.test(m)) return 'Mapbox blocked this origin — allow http://localhost:5173 in token URL restrictions.'
    if (/429/i.test(m)) return 'Mapbox rate limit — try again shortly.'
    if (/422/i.test(m))
      return /limit must be combined|type parameter when reverse/i.test(m)
        ? 'Mapbox reverse geocoding: invalid limit/types combination.'
        : 'Invalid location query for Mapbox (422 — see response message).'
  }
  return 'Search failed. Check your connection and Mapbox token.'
}

export function newMapboxSessionToken(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

export interface MapboxFeature {
  id: string
  type: 'Feature'
  place_name: string
  text: string
  center: [number, number]
  context?: Array<{ id: string; text: string; short_code?: string }>
  properties?: Record<string, unknown>
  geometry?: { type?: string; coordinates?: unknown }
}

type RawGeocodeFeature = Record<string, unknown> & {
  id?: string
  place_name?: string
  text?: string
  center?: unknown
  context?: MapboxFeature['context']
  properties?: unknown
  geometry?: { type?: string; coordinates?: unknown }
}

/** Ensure `center` exists (Mapbox usually sends it; some clients only have Point geometry). */
export function normalizeGeocodeFeature(raw: RawGeocodeFeature, index = 0): MapboxFeature | null {
  let id = raw.id != null ? String(raw.id).trim() : ''
  let lng: number | undefined
  let lat: number | undefined
  const c = raw.center
  if (Array.isArray(c) && c.length >= 2) {
    lng = Number(c[0])
    lat = Number(c[1])
  }
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    const g = raw.geometry
    if (g?.type === 'Point' && Array.isArray(g.coordinates) && g.coordinates.length >= 2) {
      lng = Number(g.coordinates[0])
      lat = Number(g.coordinates[1])
    }
  }
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  if (!id) id = `geocode-fallback.${index}`
  return {
    id,
    type: 'Feature',
    place_name: String(raw.place_name ?? ''),
    text: String(raw.text ?? ''),
    center: [lng!, lat!],
    context: raw.context,
    properties: raw.properties as Record<string, unknown> | undefined,
    geometry: raw.geometry,
  }
}

export interface ParsedGeocodeResult {
  /** Street line only (no house number). */
  street_line: string
  locality: string
  city: string
  state: string
  postal_code: string
  place_name: string
  longitude: number
  latitude: number
}

function contextText(ctx: MapboxFeature['context'], prefixes: string[]): string {
  if (!Array.isArray(ctx)) return ''
  for (const p of prefixes) {
    const hit = ctx.find(c => typeof c.id === 'string' && c.id.startsWith(p))
    if (hit?.text) return hit.text
  }
  return ''
}

/** First plausible Indian PIN (6 digits) from a feature or its context. */
function postcodeDigitsFromFeature(f: MapboxFeature): string {
  if (f.id.startsWith('postcode.')) {
    const fromText = String(f.text ?? '').replace(/\D/g, '')
    if (fromText.length === 6) return fromText.slice(0, 6)
  }
  const parsed = parseMapboxFeature(f)
  const fromCtx = parsed?.postal_code?.replace(/\D/g, '') ?? ''
  if (fromCtx.length === 6) return fromCtx.slice(0, 6)
  const m = String(f.place_name ?? '').match(/\b(\d{6})\b/)
  if (m?.[1]) return m[1]
  return ''
}

/** Prefer the most specific non-postcode feature for street / area text; scan all for PIN. */
function pickPrimaryReverseFeature(features: MapboxFeature[]): MapboxFeature | null {
  if (!features.length) return null
  const addr = features.find(x => x.id.startsWith('address.'))
  if (addr) return addr
  const poi = features.find(x => x.id.startsWith('poi.'))
  if (poi) return poi
  const notPostOrCountry = features.find(x => !x.id.startsWith('postcode.') && !x.id.startsWith('country.'))
  return notPostOrCountry ?? features[0] ?? null
}

function mergePostcodeFromReverseFeatures(features: MapboxFeature[]): string {
  for (const f of features) {
    const p = postcodeDigitsFromFeature(f)
    if (p) return p
  }
  return ''
}

/** Map a Geocoding feature to form fields (house number left empty intentionally). */
export function parseMapboxFeature(f: MapboxFeature): ParsedGeocodeResult | null {
  if (!f?.center || !Array.isArray(f.center) || f.center.length < 2) return null
  const [lng, lat] = f.center
  const ctx = f.context
  const postal_code = contextText(ctx, ['postcode'])
  const state = contextText(ctx, ['region'])
  const city = contextText(ctx, ['place']) || contextText(ctx, ['district'])
  const locality = contextText(ctx, ['locality', 'neighborhood'])

  const text = String(f.text ?? '').trim()
  const place_name = String(f.place_name ?? '').trim()
  const street_line =
    text ||
    place_name.split(',')[0]?.trim() ||
    ''

  return {
    street_line,
    locality: locality || contextText(ctx, ['locality', 'neighborhood']) || '',
    city: city || contextText(ctx, ['place']) || '',
    state: state || '',
    postal_code: postal_code.replace(/\D/g, '').slice(0, 6) || postal_code,
    place_name,
    longitude: lng,
    latitude: lat,
  }
}

/** Same minimum as typical Mapbox autocomplete samples (`query.length < 2` → no request). */
export const MAPBOX_FORWARD_MIN_LENGTH = 2

export async function mapboxForwardGeocode(
  query: string,
  opts: {
    proximity?: { lng: number; lat: number } | null
    limit?: number
    /** When set, restricts results (e.g. `IN`). Omit for the minimal token+autocomplete+limit request. */
    country?: string
    language?: string
    signal?: AbortSignal
  } = {},
): Promise<MapboxFeature[]> {
  const token = getMapboxAccessToken()
  if (!token) throw new Error('Mapbox token missing (set VITE_MAPBOX_ACCESS_TOKEN).')
  const q = query.trim()
  if (q.length < MAPBOX_FORWARD_MIN_LENGTH) return []

  const limit = opts.limit ?? 5
  const proximity =
    opts.proximity && Number.isFinite(opts.proximity.lng) && Number.isFinite(opts.proximity.lat)
      ? reverseGeocodePathSegment(opts.proximity.lng, opts.proximity.lat)
      : ''

  const path = `${GEOCODE_BASE}/${encodeURIComponent(q)}.json`
  /** Match minimal Mapbox forward-geocode usage: access_token, autocomplete, limit; add optional filters only when passed. */
  const params = new URLSearchParams({
    access_token: token,
    autocomplete: 'true',
    limit: String(limit),
  })
  if (opts.country?.trim()) params.set('country', opts.country.trim().toLowerCase())
  if (opts.language?.trim()) params.set('language', opts.language.trim())
  if (proximity) params.set('proximity', proximity)

  const res = await fetch(`${path}?${params}`, { signal: opts.signal })
  if (!res.ok) {
    const raw = await res.text().catch(() => '')
    let detail = `${res.status} ${res.statusText}`
    try {
      const j = JSON.parse(raw) as { message?: string }
      if (j?.message) detail = `${res.status}: ${j.message}`
    } catch {
      if (raw.trim()) detail = raw.trim().slice(0, 240)
    }
    throw new Error(detail)
  }
  const data = (await res.json()) as { features?: RawGeocodeFeature[] }
  const raw = Array.isArray(data.features) ? data.features : []
  return raw.map((r, i) => normalizeGeocodeFeature(r, i)).filter((f): f is MapboxFeature => f != null)
}

function parsedReverseFromFeatures(
  features: MapboxFeature[],
  pinLng: number,
  pinLat: number,
): ParsedGeocodeResult | null {
  if (!features.length) return null
  const mergedPin = mergePostcodeFromReverseFeatures(features)
  const tryFeature = (f: MapboxFeature): ParsedGeocodeResult | null => {
    const parsed = parseMapboxFeature(f)
    if (!parsed) return null
    const postal_code =
      mergedPin ||
      String(parsed.postal_code)
        .replace(/\D/g, '')
        .slice(0, 6) ||
      parsed.postal_code
    return { ...parsed, postal_code, longitude: pinLng, latitude: pinLat }
  }
  const primary = pickPrimaryReverseFeature(features)
  if (primary) {
    const hit = tryFeature(primary)
    if (hit) return hit
  }
  for (const f of features) {
    const hit = tryFeature(f)
    if (hit) return hit
  }
  for (const f of features) {
    const pn = String(f.place_name ?? '').trim()
    if (!pn) continue
    return {
      street_line: String(f.text ?? '').trim() || pn.split(',')[0]?.trim() || '',
      locality: contextText(f.context, ['locality', 'neighborhood']),
      city: contextText(f.context, ['place']) || contextText(f.context, ['district']),
      state: contextText(f.context, ['region']),
      postal_code: mergedPin || postcodeDigitsFromFeature(f) || '',
      place_name: pn,
      longitude: pinLng,
      latitude: pinLat,
    }
  }
  return null
}

export async function mapboxReverseGeocode(
  lng: number,
  lat: number,
  opts?: { language?: string; signal?: AbortSignal },
): Promise<ParsedGeocodeResult | null> {
  const token = getMapboxAccessToken()
  if (!token) throw new Error('Mapbox token missing (set VITE_MAPBOX_ACCESS_TOKEN).')
  const language = opts?.language ?? 'en'
  const path = `${GEOCODE_BASE}/${reverseGeocodePathSegment(lng, lat)}.json`
  /**
   * Do not send `limit` on reverse without exactly one `types` value — Mapbox returns 422:
   * "limit must be combined with a single type parameter when reverse geocoding".
   */
  const params = new URLSearchParams({
    access_token: token,
    language,
  })
  const res = await fetch(`${path}?${params}`, { signal: opts?.signal })
  if (!res.ok) return null
  const data = (await res.json()) as { features?: RawGeocodeFeature[] }
  const rawList = Array.isArray(data.features) ? data.features : []
  const features = rawList.map((r, i) => normalizeGeocodeFeature(r, i)).filter((x): x is MapboxFeature => x != null)
  return parsedReverseFromFeatures(features, lng, lat)
}

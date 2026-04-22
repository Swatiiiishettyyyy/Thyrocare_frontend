const STORAGE_KEY = 'nucleotide:address-recent-v1'
const MAX = 10

export type RecentAddressSearch = {
  query: string
  place_name: string
  lat?: number
  lng?: number
  street_line?: string
  locality?: string
  city?: string
  state?: string
  postal_code?: string
}

function readAll(): RecentAddressSearch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const p = JSON.parse(raw) as unknown
    return Array.isArray(p) ? (p as RecentAddressSearch[]) : []
  } catch {
    return []
  }
}

function writeAll(list: RecentAddressSearch[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* quota */
  }
}

export function loadRecentAddressSearches(): RecentAddressSearch[] {
  return readAll()
}

/** FIFO, max 10; dedupe by normalized query. */
export function appendRecentAddressSearch(entry: RecentAddressSearch): void {
  const q = entry.query.trim().toLowerCase()
  if (!q) return
  const list = readAll().filter(x => x.query.trim().toLowerCase() !== q)
  list.unshift({ ...entry, query: entry.query.trim() })
  writeAll(list.slice(0, MAX))
}

export function filterRecentsByQuery(recents: RecentAddressSearch[], query: string): RecentAddressSearch[] {
  const t = query.trim().toLowerCase()
  if (t.length < 2) return []
  return recents.filter(
    r =>
      r.query.toLowerCase().includes(t) ||
      r.place_name.toLowerCase().includes(t) ||
      (r.city && r.city.toLowerCase().includes(t)) ||
      (r.locality && r.locality.toLowerCase().includes(t)),
  )
}

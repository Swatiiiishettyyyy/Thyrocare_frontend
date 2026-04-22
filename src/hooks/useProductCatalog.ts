import { useEffect, useState } from 'react'
import { fetchProducts, type ThyrocareProduct } from '../api/products'

let cached: ThyrocareProduct[] | null = null
let inflight: Promise<ThyrocareProduct[]> | null = null

const LS_KEY = 'nucleotide_catalog_v2'
const TTL_MS = 30 * 60 * 1000 // 30 minutes

function readLS(): ThyrocareProduct[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw) as { ts: number; data: ThyrocareProduct[] }
    if (!Array.isArray(data) || data.length === 0) return null
    if (Date.now() - ts > TTL_MS) return null
    return data
  } catch {
    return null
  }
}

function writeLS(data: ThyrocareProduct[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), data })) } catch { /* quota */ }
}

// Warm the in-memory cache from localStorage on first import (before any component mounts).
if (!cached) {
  const fromLS = readLS()
  if (fromLS) cached = fromLS
}

function loadCatalog(): Promise<ThyrocareProduct[]> {
  if (cached) return Promise.resolve(cached)
  if (!inflight) {
    inflight = fetchProducts()
      .then((p) => {
        cached = p
        writeLS(p)
        return p
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

/**
 * Single shared catalog fetch for home + browse pages (avoids duplicate full pagination calls).
 */
export function useProductCatalog() {
  const [products, setProducts] = useState<ThyrocareProduct[]>(() => cached ?? [])
  const [ready, setReady] = useState(Boolean(cached))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadCatalog()
      .then((p) => {
        if (!cancelled) {
          setProducts(p)
          setError(null)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(String(e))
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { products, ready, error }
}

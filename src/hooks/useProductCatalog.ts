import { useEffect, useState } from 'react'
import { fetchProducts, type ThyrocareProduct } from '../api/products'

let cached: ThyrocareProduct[] | null = null
let inflight: Promise<ThyrocareProduct[]> | null = null

function loadCatalog(): Promise<ThyrocareProduct[]> {
  if (cached) return Promise.resolve(cached)
  if (!inflight) {
    inflight = fetchProducts()
      .then((p) => {
        cached = p
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

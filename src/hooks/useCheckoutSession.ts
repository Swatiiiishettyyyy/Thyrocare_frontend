import { useState, useEffect, useCallback } from 'react'
import type { CartItem } from '../types'
import type { CartGroup, PriceBreakup } from '../api/cart'

export interface CheckoutSession {
  cartItems: CartItem[]
  groups: CartGroup[]           // one per product, each with its own group_id/members/address/slot
  netPayableAmount: number | null
  /** From POST /thyrocare/cart/price-breakup — aligns sidebar subtotal/savings with payable total */
  thyrocarePricing: PriceBreakup | null
  /** Must match checkoutPricingSnapshotKey(groups, cartItems) or pricing is ignored / cleared */
  pricingSnapshotKey: string | null
  /** Set when GET /cart/view + active-groups sync fails on checkout routes */
  checkoutSyncError: string | null
}

const KEY = 'nucleotide_checkout'

const DEFAULTS: CheckoutSession = {
  cartItems: [],
  groups: [],
  netPayableAmount: null,
  thyrocarePricing: null,
  pricingSnapshotKey: null,
  checkoutSyncError: null,
}

function load(): CheckoutSession {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const parsed = { ...DEFAULTS, ...JSON.parse(raw) } as CheckoutSession
    if ((parsed.thyrocarePricing || parsed.netPayableAmount) && !parsed.pricingSnapshotKey) {
      parsed.thyrocarePricing = null
      parsed.netPayableAmount = null
    }
    return parsed
  } catch {
    return DEFAULTS
  }
}

function save(s: CheckoutSession) {
  try { sessionStorage.setItem(KEY, JSON.stringify(s)) } catch { /* quota */ }
}

export function useCheckoutSession() {
  const [session, setSession] = useState<CheckoutSession>(load)

  useEffect(() => { save(session) }, [session])

  const update = useCallback((patch: Partial<CheckoutSession>) => {
    setSession(prev => ({ ...prev, ...patch }))
  }, [])

  // Update a single group by group_id (merges partial fields)
  const updateGroup = useCallback((group_id: string, patch: Partial<CartGroup>) => {
    setSession(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.group_id === group_id ? { ...g, ...patch } : g),
    }))
  }, [])

  // Replace or insert a group
  const upsertGroup = useCallback((group: CartGroup) => {
    setSession(prev => {
      const exists = prev.groups.some(g => g.group_id === group.group_id)
      return {
        ...prev,
        groups: exists
          ? prev.groups.map(g => g.group_id === group.group_id ? group : g)
          : [...prev.groups, group],
      }
    })
  }, [])

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(KEY)
    // Also clear Cart Page-1 local selections so /cart becomes empty after successful order.
    try { localStorage.removeItem('nucleotide_cart_page1_v1') } catch { /* ignore */ }
    setSession(DEFAULTS)
  }, [])

  return { session, update, updateGroup, upsertGroup, clearSession }
}

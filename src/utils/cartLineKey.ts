import type { CartItem, TestCardProps } from '../types'

/** Stable row identity for cart lines (avoids collisions when display names match). */
export function cartLineKey(item: CartItem): string {
  const cid = item.cartItemId != null ? Number(item.cartItemId) : NaN
  if (Number.isFinite(cid) && cid > 0) return `cid:${cid}`
  const pid = item.thyrocareProductId != null ? Number(item.thyrocareProductId) : NaN
  if (Number.isFinite(pid) && pid > 0) return `tc:${pid}`
  const n = (item.name ?? '').trim().toLowerCase()
  return `name:${n}`
}

/** Merge adds into an existing line: same Thyrocare product, or same name when no product id. */
export function findExistingLineForAdd(cartItems: CartItem[], test: TestCardProps): CartItem | undefined {
  const pid = test.thyrocareProductId != null ? Number(test.thyrocareProductId) : NaN
  if (Number.isFinite(pid)) {
    return cartItems.find(i => Number(i.thyrocareProductId) === pid)
  }
  const n = test.name.trim().toLowerCase()
  return cartItems.find(i => {
    const ip = i.thyrocareProductId != null ? Number(i.thyrocareProductId) : NaN
    if (Number.isFinite(ip)) return false
    return i.name.trim().toLowerCase() === n
  })
}

/**
 * Member list for Thyrocare upsert/add: only truncate when reducing count.
 * Returns null if we need more distinct members than selected (caller must not invent duplicates).
 */
export function memberIdsForQuantity(memberIds: number[], targetQty: number): number[] | null {
  if (targetQty < 1) return null
  if (!Array.isArray(memberIds) || memberIds.length === 0) return null
  if (targetQty > memberIds.length) return null
  return memberIds.slice(0, targetQty)
}

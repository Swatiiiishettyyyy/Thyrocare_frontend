import { api } from './client'
import type { CartItem } from '../types'
import { parseMoney } from '../utils/money'
import { fetchProductById } from './products'

// ── Types ────────────────────────────────────────────────────────────────────

export interface CartGroupItem {
  cart_item_id: number
  member_id: number
  appointment_date: string
  appointment_start_time: string
}

export interface CartGroup {
  group_id: string
  thyrocare_product_id: number
  product_name: string
  address_id: number | null
  member_ids: number[]
  appointment_date: string        // "" if not set
  appointment_start_time: string  // "" if not set
  items: CartGroupItem[]
}

export interface PriceBreakup {
  net_payable_amount: number      // parsed from string
  total_mrp: number
  total_selling_price: number
}

/** Keep only Thyrocare groups that still match a cart line (avoids stale active-all after user removes items). */
export function filterGroupsToMatchCartItems(groups: CartGroup[], cartLines: CartItem[]): CartGroup[] {
  const pidSet = new Set(
    cartLines.map(i => Number(i.thyrocareProductId)).filter(n => Number.isFinite(n)),
  )
  const nameSet = new Set(cartLines.map(i => i.name.trim().toLowerCase()).filter(Boolean))
  return groups.filter(g => {
    const gp = Number(g.thyrocare_product_id)
    if (Number.isFinite(gp) && pidSet.has(gp)) return true
    const gn = (g.product_name ?? '').trim().toLowerCase()
    return gn.length > 0 && nameSet.has(gn)
  })
}

// ── Active groups ─────────────────────────────────────────────────────────────

function extractGroupsArray(res: any): any[] {
  if (res == null) return []
  if (Array.isArray(res)) return res
  const candidates = [
    res?.data?.groups,
    res?.groups,
    res?.data?.data?.groups,
    res?.active_groups,
    res?.data?.active_groups,
  ]
  for (const c of candidates) {
    if (Array.isArray(c)) return c
  }
  return []
}

function normalizeCartGroupRow(raw: any): CartGroup | null {
  if (raw == null || raw.group_id == null) return null
  const gid = String(raw.group_id).trim()
  if (!gid) return null
  const pid = Number(raw.thyrocare_product_id ?? raw.product_id)
  if (!Number.isFinite(pid)) return null
  const member_ids = Array.isArray(raw.member_ids)
    ? raw.member_ids.map((m: any) => Number(m)).filter(Number.isFinite)
    : []
  const items: CartGroupItem[] = Array.isArray(raw.items)
    ? raw.items
        .map((it: any) => ({
          cart_item_id: Number(it.cart_item_id ?? it.id),
          member_id: Number(it.member_id),
          appointment_date: String(it.appointment_date ?? ''),
          appointment_start_time: String(it.appointment_start_time ?? ''),
        }))
        .filter((it: CartGroupItem) => Number.isFinite(it.cart_item_id) && Number.isFinite(it.member_id))
    : []
  return {
    group_id: gid,
    thyrocare_product_id: pid,
    product_name: String(raw.product_name ?? ''),
    address_id: raw.address_id != null ? Number(raw.address_id) : null,
    member_ids,
    appointment_date: String(raw.appointment_date ?? ''),
    appointment_start_time: String(raw.appointment_start_time ?? ''),
    items,
  }
}

export async function fetchActiveGroups(): Promise<CartGroup[]> {
  const res = await api.get<any>('/thyrocare/cart/active-all')
  return extractGroupsArray(res).map(normalizeCartGroupRow).filter((g): g is CartGroup => g != null)
}

/** When checkout only involves one product, backend may return a single-product slice. */
export async function fetchActiveGroupsForProduct(productId: number): Promise<CartGroup[]> {
  const res = await api.get<any>(`/thyrocare/cart/active?product_id=${productId}`)
  return extractGroupsArray(res).map(normalizeCartGroupRow).filter((g): g is CartGroup => g != null)
}

// ── Product-level mutations (new flow) ────────────────────────────────────────

/** Page-1 deselect rule: delete the saved group rows for this product immediately. */
export async function deleteCartProduct(thyrocare_product_id: number): Promise<void> {
  const pid = Number(thyrocare_product_id)
  if (!Number.isFinite(pid) || pid <= 0) return
  await api.delete(`/thyrocare/cart/product/${pid}`)
}

/**
 * Page-2 rule: one product group upsert (retire old rows, write fresh).
 * Matches backend contract: `{ thyrocare_product_id, member_ids: [...], address_id, group_id?: existing_group_id }`.
 */
export async function upsertCartByProduct(body: {
  thyrocare_product_id: number
  member_ids: number[]
  address_id: number
  group_id?: string | null
}): Promise<string> {
  const payload: Record<string, unknown> = {
    thyrocare_product_id: body.thyrocare_product_id,
    member_ids: body.member_ids,
    address_id: body.address_id,
  }
  const gid = body.group_id != null ? String(body.group_id).trim() : ''
  if (gid) payload.group_id = gid
  const res = await api.put<any>('/thyrocare/cart/upsert', payload)
  const out = res?.group_id ?? res?.data?.group_id ?? gid
  return out ? String(out) : gid
}

// ── Add (POST /thyrocare/cart/add) ───────────────────────────────────────────

/**
 * Add or extend a blood-test line via `POST /thyrocare/cart/add` (same as Address “Continue”).
 * Requires `address_id` and `member_ids` when the user has checkout context; otherwise keep the line local until Address.
 */
export async function addBloodTestToCart(body: {
  thyrocare_product_id: number
  quantity?: number
  member_ids?: number[]
  address_id?: number
}): Promise<void> {
  const payload: Record<string, unknown> = {
    thyrocare_product_id: body.thyrocare_product_id,
  }
  if (body.quantity != null && body.quantity > 0) payload.quantity = body.quantity
  if (body.member_ids != null && body.member_ids.length > 0) payload.member_ids = body.member_ids
  if (body.address_id != null && Number.isFinite(body.address_id)) payload.address_id = body.address_id
  await api.post('/thyrocare/cart/add', payload)
}

function pickGroupIdFromAddResponse(res: any): string | null {
  const g = res?.group_id ?? res?.data?.group_id
  if (g == null) return null
  const s = String(g).trim()
  return s || null
}

/**
 * Find an existing Thyrocare row for this product (server may only expose it on active?product_id).
 */
export async function resolveExistingThyrocareGroup(productId: number): Promise<CartGroup | null> {
  const pid = Number(productId)
  if (!Number.isFinite(pid)) return null
  const narrowed = await fetchActiveGroupsForProduct(pid)
  const fromNarrow = narrowed.find(g => Number(g.thyrocare_product_id) === pid && String(g.group_id ?? '').trim())
  if (fromNarrow) return fromNarrow
  const all = await fetchActiveGroups()
  const found = all.find(g => Number(g.thyrocare_product_id) === pid && String(g.group_id ?? '').trim())
  return found ?? null
}

/**
 * Create or update the Thyrocare cart group for checkout.
 * When POST /add returns 422 (line already exists for those members), resolves `group_id` from
 * active groups and applies the selection via PUT /upsert so the client stays in sync.
 */
export async function ensureThyrocareCartGroup(
  thyrocare_product_id: number,
  member_ids: number[],
  address_id: number,
  known_group_id?: string | null,
): Promise<string> {
  const upsertKnown = async (gid: string) =>
    upsertCart(gid, thyrocare_product_id, member_ids, address_id)

  if (known_group_id && String(known_group_id).trim()) {
    try {
      return await upsertKnown(String(known_group_id).trim())
    } catch (e: any) {
      const st = e?.status
      if (st !== 500 && st !== 404) throw e
    }
  }

  try {
    const res = await api.post<any>('/thyrocare/cart/add', {
      thyrocare_product_id,
      member_ids,
      address_id,
    })
    const id = pickGroupIdFromAddResponse(res)
    if (!id) throw new Error('Missing group_id from cart add response')
    return id
  } catch (err: any) {
    if (err?.status !== 422) throw err
    const existing = await resolveExistingThyrocareGroup(thyrocare_product_id)
    if (!existing?.group_id) {
      const msg =
        (typeof err?.data?.message === 'string' && err.data.message) ||
        'Could not update this test in your cart. Try removing the line and adding it again.'
      const wrapped: any = new Error(msg)
      wrapped.status = 422
      wrapped.data = err?.data
      throw wrapped
    }
    return await upsertKnown(existing.group_id)
  }
}

/** @deprecated Prefer ensureThyrocareCartGroup — it handles duplicate-line 422 from /add. */
export async function addToCart(
  thyrocare_product_id: number,
  member_ids: number[],
  address_id: number,
): Promise<{ groupId: string | null }> {
  const res = await api.post<any>('/thyrocare/cart/add', { thyrocare_product_id, member_ids, address_id })
  return { groupId: pickGroupIdFromAddResponse(res) }
}

// ── Upsert (update members/address on existing group) ────────────────────────

export async function upsertCart(
  group_id: string,
  thyrocare_product_id: number,
  member_ids: number[],
  address_id: number,
): Promise<string> {
  const res = await api.put<any>('/thyrocare/cart/upsert', {
    group_id,
    thyrocare_product_id,
    member_ids,
    address_id,
  })
  return res?.group_id ?? res?.data?.group_id ?? group_id
}

// ── Price breakup for all groups ─────────────────────────────────────────────

export async function fetchPriceBreakup(group_ids: string[]): Promise<PriceBreakup> {
  const res = await api.post<any>('/thyrocare/cart/price-breakup', {
    group_ids,
    is_report_hard_copy_required: false,
  })
  const pricing = res?.data?.pricing
  return {
    net_payable_amount: parseFloat(pricing?.net_payable_amount ?? '0'),
    total_mrp: parseFloat(pricing?.total_mrp ?? '0'),
    total_selling_price: parseFloat(pricing?.total_selling_price ?? '0'),
  }
}

/**
 * Fingerprint of checkout shape when price-breakup was fetched (groups + cart lines).
 * Excludes slot times so changing appointment does not invalidate pricing.
 */
export function checkoutPricingSnapshotKey(groups: CartGroup[], items: CartItem[]): string {
  const g = [...groups]
    .map(x =>
      [
        x.group_id,
        String(x.thyrocare_product_id),
        [...(x.member_ids ?? [])].sort((a, b) => a - b).join('-'),
        String(x.address_id ?? ''),
      ].join(':'),
    )
    .sort()
    .join('|')
  const c = [...items]
    .map(i => `${i.thyrocareProductId ?? i.name}:${i.quantity}`)
    .sort()
    .join(',')
  return `${g}#${c}`
}

function isCheckoutPricingFresh(
  items: CartItem[],
  groups: CartGroup[] | undefined,
  pricingSnapshotKey: string | null | undefined,
  thyrocarePricing: PriceBreakup | null | undefined,
): boolean {
  if (!thyrocarePricing || !pricingSnapshotKey || !groups?.length) return false
  return pricingSnapshotKey === checkoutPricingSnapshotKey(groups, items)
}

/** Sum of checkout line quantities (patients). Aligns with `getCheckoutPriceSummary` line qty rules. */
export function checkoutPatientCount(items: CartItem[]): number {
  return items.reduce((s, i) => s + Math.max(1, Math.floor(Number(i.quantity) || 1)), 0)
}

/**
 * Checkout sidebar / payment totals.
 * - Prefer Thyrocare price-breakup when it still matches the current groups + cart fingerprint.
 * - Otherwise sum per-line amounts in **whole rupees** (round each line, then add) so line items,
 *   subtotal, savings, and total always agree (matches Payment page line display).
 */
export function getCheckoutPriceSummary(
  items: CartItem[],
  opts: {
    thyrocarePricing: PriceBreakup | null | undefined
    netPayableAmount: number | null | undefined
    groups?: CartGroup[]
    pricingSnapshotKey?: string | null
  },
): { subtotal: number; savings: number; total: number } {
  const useBreakup =
    isCheckoutPricingFresh(items, opts.groups, opts.pricingSnapshotKey, opts.thyrocarePricing)
    && opts.thyrocarePricing != null

  if (useBreakup) {
    const p = opts.thyrocarePricing!
    const subtotal = Math.round(Number(p.total_mrp) || 0)
    const rawNet =
      opts.netPayableAmount != null && Number.isFinite(Number(opts.netPayableAmount))
        ? Number(opts.netPayableAmount)
        : Number(p.net_payable_amount) || 0
    const total = Math.round(rawNet)
    const savings = Math.max(0, subtotal - total)
    return { subtotal, savings, total }
  }

  let clientSubtotal = 0
  let clientTotal = 0
  for (const i of items) {
    // Match checkout UI: treat missing/0 qty as 1; fractional qty floors (patient counts are whole).
    const q = Math.max(1, Math.floor(Number(i.quantity) || 1))
    clientSubtotal += Math.round(parseMoney(i.originalPrice) * q)
    clientTotal += Math.round(parseMoney(i.price) * q)
  }
  const savings = Math.max(0, clientSubtotal - clientTotal)
  return { subtotal: clientSubtotal, savings, total: clientTotal }
}

// ── Pincode serviceability ────────────────────────────────────────────────────

export interface ServiceabilityResult {
  serviceable: boolean
  message?: string
}

export async function checkPincodeServiceability(pincode: string): Promise<ServiceabilityResult> {
  try {
    const res = await api.get<any>(`/thyrocare/check-serviceable?pincode=${pincode}`)
    const serviceable =
      res?.serviceable === true ||
      res?.is_serviceable === true ||
      res?.data?.serviceable === true ||
      res?.data?.is_serviceable === true ||
      res?.status === 'serviceable'
    return { serviceable, message: res?.message ?? res?.data?.message }
  } catch (err: any) {
    throw err
  }
}


export interface CartItemAPI {
  [key: string]: unknown
  /** Row id for DELETE `/cart/delete/{id}` — API may send `cart_item_id` instead */
  id?: number
  cart_item_id?: number
  thyrocare_product_id: number
  quantity: number
  /** Present when API attaches cart id to line items */
  cart_id?: number
  /** When present, must match an active Thyrocare group or the row is treated as stale */
  group_id?: string
  member_id?: number
  is_active?: boolean | number | string
  active?: boolean | number | string
  deleted_at?: string | null
  status?: string
  product?: {
    id: number
    name: string
    type: string
    no_of_tests_included: number
    listing_price: number
    selling_price: number
    beneficiaries_max: number
    is_fasting_required: boolean | null
  }
}

export interface CartViewResult {
  cartId: number | null
  items: CartItemAPI[]
}

async function fillMissingPricesFromCatalog(items: CartItem[]): Promise<CartItem[]> {
  const needs = items
    .filter(i => (parseMoney(i.price) <= 0 || parseMoney(i.originalPrice) <= 0) && i.thyrocareProductId != null)
    .map(i => Number(i.thyrocareProductId))
    .filter(n => Number.isFinite(n) && n > 0)
  const unique = [...new Set(needs)]
  if (unique.length === 0) return items

  const byId = new Map<number, { price: string; originalPrice: string; maxBeneficiaries?: number }>()
  await Promise.all(
    unique.map(async id => {
      try {
        const p = await fetchProductById(id)
        byId.set(id, {
          price: String(Math.round(Number(p.selling_price ?? 0) || 0)),
          originalPrice: String(Math.round(Number(p.listing_price ?? 0) || 0)),
          maxBeneficiaries: Number(p.beneficiaries_max) || undefined,
        })
      } catch {
        /* ignore */
      }
    }),
  )

  if (byId.size === 0) return items

  return items.map(i => {
    const pid = i.thyrocareProductId != null ? Number(i.thyrocareProductId) : NaN
    const row = Number.isFinite(pid) ? byId.get(pid) : undefined
    if (!row) return i
    const next = { ...i }
    if (parseMoney(next.price) <= 0 && parseMoney(row.price) > 0) next.price = row.price
    if (parseMoney(next.originalPrice) <= 0 && parseMoney(row.originalPrice) > 0) next.originalPrice = row.originalPrice
    if ((next.maxBeneficiaries == null || next.maxBeneficiaries <= 0) && row.maxBeneficiaries != null && row.maxBeneficiaries > 0) {
      next.maxBeneficiaries = row.maxBeneficiaries
    }
    return next
  })
}

function pickCartId(...candidates: unknown[]): number | null {
  for (const v of candidates) {
    if (v == null) continue
    const n = typeof v === 'number' ? v : Number(v)
    if (Number.isFinite(n) && n > 0) return n
  }
  return null
}

function asObj(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function pickPositiveInt(...vals: unknown[]): number | undefined {
  for (const v of vals) {
    const n = typeof v === 'number' ? v : Number(v)
    if (Number.isFinite(n) && n > 0) return n
  }
  return undefined
}

/**
 * Many `/cart/view` responses wrap lines as `{ status, data: { cart_items: [...] } }` or nest the
 * row under `cart_item` / `line`. Extract a flat array of raw line objects.
 */
function extractRawCartLines(res: unknown): unknown[] {
  if (Array.isArray(res)) return res
  const root = asObj(res)
  const data = root?.data !== undefined ? root.data : res
  if (Array.isArray(data)) return data
  const d = asObj(data) ?? root
  if (!d) return []

  const nested = [
    d.cart_items,
    d.items,
    d.lines,
    d.results,
    asObj(d.cart)?.cart_items,
    asObj(d.cart)?.items,
    asObj(d.cart)?.lines,
    asObj(d.data)?.cart_items,
    asObj(d.data)?.items,
  ]
  for (const arr of nested) {
    if (Array.isArray(arr)) return arr
  }
  return []
}

function pickCartIdFromEnvelope(res: unknown, rawLines: unknown[]): number | null {
  const root = asObj(res)
  const data = root?.data !== undefined ? root.data : res
  const d = asObj(data) ?? root
  const first = asObj(rawLines[0])
  return pickCartId(
    d?.cart_id,
    asObj(d?.cart)?.id,
    asObj(d?.cart)?.cart_id,
    root?.cart_id,
    first?.cart_id,
  )
}

const FALLBACK_PRODUCT_FIELDS = {
  type: 'SSKU',
  no_of_tests_included: 0,
  listing_price: 0,
  selling_price: 0,
  beneficiaries_max: 10,
  is_fasting_required: null as boolean | null,
}

/**
 * Merge nested cart line shapes into one `CartItemAPI` so `cartLineApiId` / partition see stable fields.
 */
function flattenCartViewLine(raw: unknown): CartItemAPI | null {
  const r = asObj(raw)
  if (!r) return null

  const nested =
    asObj(r.cart_item) ?? asObj(r.line) ?? asObj(r.item) ?? asObj(r.cartItem) ?? asObj(r.cart_line)

  const get = (key: string): unknown => {
    if (nested && nested[key] !== undefined && nested[key] !== null) return nested[key]
    return r[key]
  }

  const pickMoney = (o: Record<string, unknown> | null | undefined, keys: string[]): number => {
    if (!o) return 0
    for (const k of keys) {
      const v = o[k]
      const n = typeof v === 'number' ? v : Number(v)
      if (Number.isFinite(n) && n > 0) return n
    }
    return 0
  }

  const lineId = pickPositiveInt(
    get('cart_item_id'),
    get('id'),
    get('cartItemId'),
    r.cart_item_id,
    r.id,
  )

  const prod =
    asObj(get('product')) ?? asObj(r.product) ?? asObj(get('test')) ?? asObj(get('package'))

  const thyrocarePid =
    pickPositiveInt(get('thyrocare_product_id'), get('product_id'), prod?.id, prod?.product_id) ?? 0

  const qtyVal = get('quantity') ?? get('qty') ?? get('count')
  const qn = typeof qtyVal === 'number' ? qtyVal : Number(qtyVal)
  const quantity = Number.isFinite(qn) && qn > 0 ? qn : 1

  const nameHint = String(get('product_name') ?? r.product_name ?? prod?.name ?? '').trim()

  let product: NonNullable<CartItemAPI['product']>
  if (prod && (String(prod.name ?? '').trim() || pickPositiveInt(prod.id, prod.product_id))) {
    const pid = pickPositiveInt(prod.id, prod.product_id) ?? thyrocarePid
    const listing =
      pickMoney(prod, ['listing_price', 'listingPrice', 'mrp', 'max_price', 'maxPrice', 'price_mrp']) ||
      pickMoney(r, ['listing_price', 'listingPrice', 'mrp', 'max_price', 'maxPrice', 'price_mrp'])
    const selling =
      pickMoney(prod, ['selling_price', 'sellingPrice', 'discount_price', 'discountPrice', 'final_price', 'finalPrice', 'price']) ||
      pickMoney(r, ['selling_price', 'sellingPrice', 'discount_price', 'discountPrice', 'final_price', 'finalPrice', 'price'])
    product = {
      id: pid || thyrocarePid || 0,
      name: String(nameHint || prod.name || 'Item'),
      type: String(prod.type ?? 'SSKU'),
      no_of_tests_included: Number(prod.no_of_tests_included) || 0,
      listing_price: listing || selling || 0,
      selling_price: selling || listing || 0,
      beneficiaries_max: Number(prod.beneficiaries_max) || 10,
      is_fasting_required: (prod.is_fasting_required as boolean | null) ?? null,
    }
  } else if (thyrocarePid > 0 && nameHint) {
    product = {
      id: thyrocarePid,
      name: nameHint,
      ...FALLBACK_PRODUCT_FIELDS,
    }
  } else if (lineId != null) {
    return {
      id: lineId,
      cart_item_id: lineId,
      thyrocare_product_id: 0,
      quantity,
      product: undefined,
    }
  } else {
    if (import.meta.env.DEV) {
      console.warn('[cart/view] skip unparseable cart line', raw)
    }
    return null
  }

  const gidRaw = get('group_id') ?? get('cart_group_id') ?? r.group_id ?? nested?.group_id
  const out: CartItemAPI = {
    id: lineId,
    cart_item_id: lineId,
    thyrocare_product_id: thyrocarePid || product.id,
    quantity,
    cart_id: pickPositiveInt(get('cart_id'), r.cart_id),
    group_id: gidRaw != null ? String(gidRaw).trim() : undefined,
    member_id: pickPositiveInt(get('member_id'), r.member_id, get('beneficiary_id')),
    product,
  }

  const o = out as Record<string, unknown>
  for (const k of ['is_active', 'active', 'deleted_at', 'status', 'is_deleted', 'isActive', 'isDeleted'] as const) {
    const v = get(k) ?? r[k]
    if (v !== undefined) o[k] = v
  }

  return out
}

/** Normalizes /cart/view — keeps cart_id from wrapper or first line item */
/** Map `/cart/view` lines (with `product`) into app `CartItem`s — single place for hydration. */
/** Line row id for DELETE/update — backends vary (`cart_item_id` vs `id`). */
export function cartLineApiId(c: CartItemAPI): number | undefined {
  const r = c as Record<string, unknown>
  for (const key of ['cart_item_id', 'id', 'cartItemId'] as const) {
    const v = r[key]
    const n = typeof v === 'number' ? v : Number(v)
    if (Number.isFinite(n) && n > 0) return n
  }
  for (const nestKey of ['cart_item', 'line', 'item', 'cartItem', 'cart_line'] as const) {
    const nested = r[nestKey]
    const nr = asObj(nested)
    if (!nr) continue
    for (const key of ['cart_item_id', 'id', 'cartItemId'] as const) {
      const v = nr[key]
      const n = typeof v === 'number' ? v : Number(v)
      if (Number.isFinite(n) && n > 0) return n
    }
  }
  return undefined
}

/** Prefer line-level id; fall back to nested product id (some /cart/view shapes omit thyrocare_product_id). */
export function cartLineThyrocareProductId(c: CartItemAPI): number | undefined {
  const fromLine = Number(c.thyrocare_product_id)
  if (Number.isFinite(fromLine) && fromLine > 0) return fromLine
  const fromProduct = Number(c.product?.id)
  if (Number.isFinite(fromProduct) && fromProduct > 0) return fromProduct
  return undefined
}

function cartLineMemberId(c: CartItemAPI): number | undefined {
  const r = c as Record<string, unknown>
  const m = r.member_id ?? r.beneficiary_id
  const n = typeof m === 'number' ? m : Number(m)
  if (Number.isFinite(n) && n > 0) return n
  return undefined
}

/** Soft-deleted / inactive DB rows still returned by `/cart/view` */
export function isCartLineActiveRow(c: CartItemAPI): boolean {
  const r = c as Record<string, unknown>
  if (r.deleted_at != null && String(r.deleted_at).trim() !== '') return false
  const st = r.status
  if (typeof st === 'string') {
    const u = st.toLowerCase()
    if (u === 'deleted' || u === 'inactive') return false
  }
  for (const key of ['is_active', 'active', 'enabled', 'is_deleted', 'isActive', 'isDeleted'] as const) {
    if (!(key in r)) continue
    const v = r[key]
    if (key === 'is_deleted' || key === 'isDeleted') {
      if (v === true || v === 1 || v === '1') return false
      continue
    }
    if (v === false || v === 0 || v === '0') return false
  }
  return true
}

/** Same group + product + member: keep one row (prefer API-active, else lowest id); mark others stale. */
function dedupeCartViewSlots(lines: CartItemAPI[], pushStale: (c: CartItemAPI) => void): CartItemAPI[] {
  const buckets = new Map<string, CartItemAPI[]>()
  for (const c of lines) {
    const pid = cartLineThyrocareProductId(c) ?? 0
    const r = c as Record<string, unknown>
    const gid = r.group_id != null ? String(r.group_id).trim() : ''
    const mid = cartLineMemberId(c) ?? 0
    const key = `${gid}\0${pid}\0${mid}`
    const arr = buckets.get(key) ?? []
    arr.push(c)
    buckets.set(key, arr)
  }
  const out: CartItemAPI[] = []
  for (const arr of buckets.values()) {
    if (arr.length === 1) {
      out.push(arr[0])
      continue
    }
    const sorted = [...arr].sort((a, b) => {
      const ac = isCartLineActiveRow(a) ? 1 : 0
      const bc = isCartLineActiveRow(b) ? 1 : 0
      if (ac !== bc) return bc - ac
      return (cartLineApiId(a) ?? 0) - (cartLineApiId(b) ?? 0)
    })
    const winner = sorted[0]
    const winId = cartLineApiId(winner)
    out.push(winner)
    for (const c of arr) {
      if (cartLineApiId(c) !== winId) pushStale(c)
    }
  }
  return out
}

/** One Thyrocare group per product when `/cart/view` still lists superseded `group_id`s. */
function collapseToSingleGroupPerProduct(
  lines: CartItemAPI[],
  activeGroups: CartGroup[],
  pushStale: (c: CartItemAPI) => void,
): CartItemAPI[] {
  const byPid = new Map<number, CartItemAPI[]>()
  for (const c of lines) {
    const p = cartLineThyrocareProductId(c)
    if (p == null || !Number.isFinite(p)) continue
    const arr = byPid.get(p) ?? []
    arr.push(c)
    byPid.set(p, arr)
  }

  const dropIds = new Set<number>()
  for (const [pid, arr] of byPid) {
    const gids = [
      ...new Set(
        arr
          .map(c => {
            const r = c as Record<string, unknown>
            return r.group_id != null ? String(r.group_id).trim() : ''
          })
          .filter(s => s.length > 0),
      ),
    ]
    if (gids.length <= 1) continue

    const allowedGids = new Set(
      activeGroups.filter(g => Number(g.thyrocare_product_id) === pid).map(g => String(g.group_id ?? '').trim()),
    )

    let bestGid = ''
    let bestCount = -1
    let bestMaxId = -1
    for (const gid of gids) {
      if (allowedGids.size > 0 && !allowedGids.has(gid)) continue
      const sub = arr.filter(c => {
        const r = c as Record<string, unknown>
        return String(r.group_id ?? '').trim() === gid
      })
      const cnt = sub.length
      const maxId = sub.length ? Math.max(...sub.map(s => cartLineApiId(s) ?? 0)) : 0
      if (cnt > bestCount || (cnt === bestCount && maxId > bestMaxId)) {
        bestCount = cnt
        bestMaxId = maxId
        bestGid = gid
      }
    }
    if (!bestGid) {
      for (const gid of gids) {
        const sub = arr.filter(c => String((c as Record<string, unknown>).group_id ?? '').trim() === gid)
        const cnt = sub.length
        const maxId = sub.length ? Math.max(...sub.map(s => cartLineApiId(s) ?? 0)) : 0
        if (cnt > bestCount || (cnt === bestCount && maxId > bestMaxId)) {
          bestCount = cnt
          bestMaxId = maxId
          bestGid = gid
        }
      }
    }
    if (!bestGid) continue

    for (const c of arr) {
      const gid = String((c as Record<string, unknown>).group_id ?? '').trim()
      if (gid && gid !== bestGid) {
        const lid = cartLineApiId(c)
        if (lid != null) dropIds.add(lid)
        pushStale(c)
      }
    }
  }

  return lines.filter(c => {
    const lid = cartLineApiId(c)
    return lid == null || !dropIds.has(lid)
  })
}

/**
 * Keep only cart lines that belong to the current checkout: active rows + matching `fetchActiveGroups()`.
 * Returns ids to DELETE on the server so ghosts from old groups / products do not stay in the UI.
 */
export function partitionCartViewLinesForCheckout(
  lines: CartItemAPI[],
  activeGroups: CartGroup[],
): { keep: CartItemAPI[]; staleLineIds: number[] } {
  const staleLineIds: number[] = []
  const withProduct = lines.filter(c => c.product != null)

  const pushStale = (c: CartItemAPI) => {
    const lid = cartLineApiId(c)
    if (lid != null) staleLineIds.push(lid)
  }

  let working = dedupeCartViewSlots(withProduct, pushStale)

  working = working.filter(c => {
    if (isCartLineActiveRow(c)) return true
    pushStale(c)
    return false
  })

  if (activeGroups.length > 0) {
    working = collapseToSingleGroupPerProduct(working, activeGroups, pushStale)
  }

  // If backend returns one row per member, ensure we only keep members that are still selected in the
  // active Thyrocare group. Otherwise, `/orders/create` will compute totals from stale extra rows.
  if (activeGroups.length > 0) {
    const allowedByGidPid = new Map<string, Set<number>>() // `${gid}\0${pid}` -> memberId set
    for (const g of activeGroups) {
      const gid = String(g.group_id ?? '').trim()
      const pid = Number(g.thyrocare_product_id)
      if (!gid || !Number.isFinite(pid) || pid <= 0) continue
      const mids = Array.isArray(g.member_ids) ? g.member_ids.map(m => Number(m)).filter(Number.isFinite) : []
      allowedByGidPid.set(`${gid}\0${pid}`, new Set(mids))
    }
    working = working.filter(c => {
      const r = c as Record<string, unknown>
      const gid = r.group_id != null ? String(r.group_id).trim() : ''
      const pid = cartLineThyrocareProductId(c)
      const mid = cartLineMemberId(c)
      if (!gid || pid == null || !Number.isFinite(pid) || pid <= 0 || mid == null || !Number.isFinite(mid)) return true
      const allowed = allowedByGidPid.get(`${gid}\0${pid}`)
      if (!allowed || allowed.size === 0) return true
      if (allowed.has(mid)) return true
      pushStale(c)
      return false
    })
  }

  const candidates = working

  if (activeGroups.length === 0) {
    return { keep: candidates, staleLineIds }
  }

  const activeGids = new Set(
    activeGroups.map(g => String(g.group_id ?? '').trim()).filter(s => s.length > 0),
  )
  const activePids = new Set(
    activeGroups.map(g => Number(g.thyrocare_product_id)).filter(Number.isFinite),
  )

  const keep: CartItemAPI[] = []
  for (const c of candidates) {
    const r = c as Record<string, unknown>
    const gidRaw = r.group_id ?? r.cart_group_id
    const gid = gidRaw != null ? String(gidRaw).trim() : ''

    if (gid && activeGids.size > 0) {
      if (activeGids.has(gid)) {
        keep.push(c)
        continue
      }
      pushStale(c)
      continue
    }

    const pid = cartLineThyrocareProductId(c)
    if (pid != null && Number.isFinite(pid) && activePids.size > 0) {
      if (activePids.has(pid)) {
        keep.push(c)
        continue
      }
      pushStale(c)
      continue
    }

    keep.push(c)
  }

  return { keep, staleLineIds }
}

export function mapCartViewItemsToCartItems(withProduct: CartItemAPI[]): CartItem[] {
  return withProduct.map(c => {
    const lineId = cartLineApiId(c)
    if (import.meta.env.DEV && lineId == null) {
      console.warn('[cart/view] cart line has no id / cart_item_id — Remove will not call DELETE', c)
    }
    return {
    cartItemId: lineId,
    thyrocareProductId: cartLineThyrocareProductId(c),
    maxBeneficiaries: c.product?.beneficiaries_max,
    name: c.product!.name,
    type: normalizeCardType(c.product!.type),
    price: String(c.product!.selling_price ?? 0),
    originalPrice: String(c.product!.listing_price ?? 0),
    quantity: c.quantity,
  }})
}

function normalizeCardType(t: string | undefined): CartItem['type'] {
  const u = (t || '').toUpperCase()
  if (u === 'MSKU' || u === 'OFFER') return 'Package'
  return 'Single'
}

/**
 * `/cart/view` can return one row per member with `quantity=1`.
 * Collapse to one cart line per product for UI + address flow.
 * Prefer `activeGroups.member_ids.length` as the true patient count for each product.
 */
function collapseCartItemsByProduct(items: CartItem[], groups: CartGroup[]): CartItem[] {
  const byPid = new Map<number, CartItem[]>()
  const byName = new Map<string, CartItem[]>()

  for (const it of items) {
    const pid = it.thyrocareProductId != null ? Number(it.thyrocareProductId) : NaN
    if (Number.isFinite(pid) && pid > 0) {
      const arr = byPid.get(pid) ?? []
      arr.push(it)
      byPid.set(pid, arr)
      continue
    }
    const nk = (it.name ?? '').trim().toLowerCase()
    if (!nk) continue
    const arr = byName.get(nk) ?? []
    arr.push(it)
    byName.set(nk, arr)
  }

  const groupQtyByPid = new Map<number, number>()
  for (const g of groups) {
    const pid = Number(g.thyrocare_product_id)
    if (!Number.isFinite(pid) || pid <= 0) continue
    const cnt = Array.isArray(g.member_ids) ? g.member_ids.length : 0
    if (cnt > 0) groupQtyByPid.set(pid, cnt)
  }

  const out: CartItem[] = []
  const usedNameKeys = new Set<string>()

  for (const [pid, arr] of byPid) {
    const first = arr[0]
    const summed = arr.reduce((s, x) => s + (Number(x.quantity) > 0 ? Number(x.quantity) : 1), 0)
    const qty = groupQtyByPid.get(pid) ?? summed
    out.push({
      ...first,
      // For collapsed rows, cartItemId is not stable (server has 1 row per member).
      cartItemId: first.cartItemId,
      quantity: Math.max(1, Math.floor(qty)),
    })
  }

  for (const [nk, arr] of byName) {
    if (usedNameKeys.has(nk)) continue
    usedNameKeys.add(nk)
    const first = arr[0]
    const summed = arr.reduce((s, x) => s + (Number(x.quantity) > 0 ? Number(x.quantity) : 1), 0)
    out.push({
      ...first,
      quantity: Math.max(1, Math.floor(summed)),
    })
  }

  return out
}

export async function fetchCart(): Promise<CartViewResult> {
  const res = await api.get<any>('/cart/view')
  const rawLines = extractRawCartLines(res)
  const cartId = pickCartIdFromEnvelope(res, rawLines)
  const items = rawLines
    .map(flattenCartViewLine)
    .filter((row): row is CartItemAPI => row != null)
  const result: CartViewResult = { cartId, items }

  if (import.meta.env.DEV) {
    const r = (c: CartItemAPI) => c as Record<string, unknown>
    console.log('[cart/view]', {
      cartId: result.cartId,
      count: result.items.length,
      lines: result.items.map(c => ({
        id: c.id,
        cart_item_id: (c as CartItemAPI).cart_item_id,
        resolvedLineId: cartLineApiId(c),
        qty: c.quantity,
        thyrocareProductId: cartLineThyrocareProductId(c),
        name: c.product?.name ?? null,
        group_id: r(c).group_id ?? r(c).cart_group_id,
        is_active: r(c).is_active,
        active: r(c).active,
        status: r(c).status,
        deleted_at: r(c).deleted_at,
      })),
      raw: res,
    })
  }

  return result
}

export async function updateCartItem(cartItemId: number, quantity: number): Promise<void> {
  await api.put(`/cart/update/${cartItemId}`, { quantity })
}

export async function removeCartItem(cartItemId: number): Promise<void> {
  await api.delete(`/cart/delete/${cartItemId}`)
}

/** Common REST variants — first path 404 often means wrong route, not “already deleted”. */
function cartItemDeletePaths(cartItemId: number): string[] {
  return [
    `/cart/delete/${cartItemId}`,
    `/cart/${cartItemId}`,
    `/cart/items/${cartItemId}`,
    `/cart/item/${cartItemId}`,
    `/thyrocare/cart/delete/${cartItemId}`,
    `/thyrocare/cart/item/${cartItemId}`,
    `/thyrocare/cart/remove/${cartItemId}`,
  ]
}

/**
 * Hard-delete the line: try several DELETE URLs, then PUT quantity 0.
 * Avoid treating the first 404 as success (wrong path vs missing row).
 */
export async function removeCartLineBestEffort(cartItemId: number): Promise<void> {
  if (!Number.isFinite(cartItemId) || cartItemId <= 0) return

  for (const path of cartItemDeletePaths(cartItemId)) {
    try {
      await api.delete(path)
      return
    } catch (e: any) {
      const st = e?.status
      if (st === 404 || st === 405) continue
      try {
        await updateCartItem(cartItemId, 0)
      } catch (e2) {
        console.warn(`[cart] Line ${cartItemId}: DELETE ${path} failed (${st}), PUT quantity 0 failed`, e2)
      }
      return
    }
  }

  try {
    await updateCartItem(cartItemId, 0)
  } catch (e2) {
    console.warn(
      `[cart] Line ${cartItemId}: all DELETE paths returned 404/405; PUT quantity 0 failed`,
      e2,
    )
  }
}

/** Best-effort server cleanup for pruned lines; logs failures (see empty-body DELETE fix in client). */
export async function removeStaleCartLineIds(ids: number[]): Promise<void> {
  for (const id of new Set(ids)) {
    if (!Number.isFinite(id) || id <= 0) continue
    await removeCartLineBestEffort(id)
  }
}

export async function clearCart(): Promise<void> {
  await api.delete('/cart/clear')
}

/**
 * Single source of truth: GET /cart/view + GET thyrocare active groups, normalized to app state.
 * Use after any mutation (add / update qty / remove / upsert) so UI matches the DB.
 */
export async function pullCheckoutSnapshot(input: {
  previousGroups: CartGroup[]
  localOnlyItems: CartItem[]
  /** Fallback pricing/details when /cart/view product payload lacks prices */
  fallbackItems?: CartItem[]
}): Promise<{
  cartItems: CartItem[]
  groups: CartGroup[]
  /** false when /cart/view had no lines with embedded `product` (only local-only lines kept) */
  hadCartLinesFromApi: boolean
}> {
  let [{ items: apiCart }, activeGroups] = await Promise.all([fetchCart(), fetchActiveGroups()])

  const ghostIds = apiCart
    .filter(c => c.product == null)
    .map(c => cartLineApiId(c))
    .filter((id): id is number => id != null)

  let { keep: prunedLines, staleLineIds } = partitionCartViewLinesForCheckout(apiCart, activeGroups)
  const toRemove = [...new Set([...ghostIds, ...staleLineIds])]
  if (toRemove.length > 0) {
    await removeStaleCartLineIds(toRemove)
    const fresh = await fetchCart()
    apiCart = fresh.items
    const again = partitionCartViewLinesForCheckout(apiCart, activeGroups)
    prunedLines = again.keep
    if (again.staleLineIds.length > 0) {
      await removeStaleCartLineIds(again.staleLineIds)
      const fresh2 = await fetchCart()
      apiCart = fresh2.items
      prunedLines = partitionCartViewLinesForCheckout(apiCart, activeGroups).keep
    }
  }

  if (prunedLines.length === 0) {
    return {
      cartItems: input.localOnlyItems,
      groups: [],
      hadCartLinesFromApi: false,
    }
  }

  const hydratedItems = mapCartViewItemsToCartItems(prunedLines)
  const collapsedHydrated = collapseCartItemsByProduct(hydratedItems, activeGroups)

  // /cart/view sometimes omits product pricing; preserve known prices from local/session items.
  const fallbacks = input.fallbackItems ?? input.localOnlyItems
  const byPid = new Map<number, CartItem>()
  const byName = new Map<string, CartItem>()
  for (const it of fallbacks) {
    const pid = it.thyrocareProductId
    if (pid != null && Number.isFinite(pid)) byPid.set(pid, it)
    const nk = it.name.trim().toLowerCase()
    if (nk) byName.set(nk, it)
  }
  const mergedItems = collapsedHydrated.map(it => {
    const fb =
      (it.thyrocareProductId != null ? byPid.get(it.thyrocareProductId) : undefined) ??
      byName.get(it.name.trim().toLowerCase())
    if (!fb) return it
    const next = { ...it }
    // Quantity source of truth: user edits patient count on Cart (session/local) must win over
    // stale server group member count until Address "Continue" upserts the new member_ids.
    if (Number.isFinite(fb.quantity) && fb.quantity > 0 && fb.quantity !== next.quantity) {
      next.quantity = fb.quantity
    }
    if (parseMoney(next.price) <= 0 && parseMoney(fb.price) > 0) next.price = fb.price
    if (parseMoney(next.originalPrice) <= 0 && parseMoney(fb.originalPrice) > 0) next.originalPrice = fb.originalPrice
    if ((next.maxBeneficiaries == null || next.maxBeneficiaries <= 0) && (fb.maxBeneficiaries != null && fb.maxBeneficiaries > 0)) {
      next.maxBeneficiaries = fb.maxBeneficiaries
    }
    return next
  })

  const finalItems =
    mergedItems.some(i => parseMoney(i.price) <= 0 || parseMoney(i.originalPrice) <= 0)
      ? await fillMissingPricesFromCatalog(mergedItems)
      : mergedItems

  // Merge in local-only lines (e.g. just added on Page-1 / detail page) that are not yet in /cart/view.
  // Without this, navigating to Address can “drop” newly added products as soon as API returns any lines.
  const keyOf = (it: CartItem): string => {
    const pid = it.thyrocareProductId != null ? Number(it.thyrocareProductId) : NaN
    if (Number.isFinite(pid) && pid > 0) return `tc:${pid}`
    return `name:${(it.name ?? '').trim().toLowerCase()}`
  }
  const apiKeys = new Set(finalItems.map(keyOf))
  const localAdds = (input.localOnlyItems ?? []).filter(x => !apiKeys.has(keyOf(x)))
  const combinedItems = localAdds.length > 0 ? [...finalItems, ...localAdds] : finalItems

  let nextGroups = activeGroups
  if (nextGroups.length === 0) {
    const pidSet = new Set(
      collapsedHydrated.map(i => Number(i.thyrocareProductId)).filter(n => Number.isFinite(n)),
    )
    const nameSet = new Set(collapsedHydrated.map(i => i.name.trim().toLowerCase()).filter(Boolean))
    const matched = input.previousGroups.filter(g => {
      const gp = Number(g.thyrocare_product_id)
      if (Number.isFinite(gp) && pidSet.has(gp)) return true
      const gn = (g.product_name ?? '').trim().toLowerCase()
      return gn.length > 0 && nameSet.has(gn)
    })
    if (matched.length > 0) nextGroups = matched
  }

  nextGroups = filterGroupsToMatchCartItems(nextGroups, combinedItems)

  return {
    cartItems: combinedItems,
    groups: nextGroups,
    hadCartLinesFromApi: true,
  }
}

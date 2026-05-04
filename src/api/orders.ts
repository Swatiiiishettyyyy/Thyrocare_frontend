import { api } from './client'
import { fetchUploadedReports } from './upload'

/**
 * POST /orders/create — Orders module: create internal order + Razorpay order from cart.
 * Do **not** use `POST /thyrocare/orders/create` from the app; Thyrocare is invoked server-side after payment.
 *
 * Body: `{ cart_id }` (reference; all active cart lines for the user are included per API).
 */
export interface PlaceOrderCreatePayload {
  cart_id: number
}

/** @deprecated Use PlaceOrderCreatePayload */
export type BloodTestOrderCreatePayload = PlaceOrderCreatePayload
/** @deprecated Use PlaceOrderCreatePayload */
export type CreateOrderPayload = PlaceOrderCreatePayload

/** Matches OpenAPI `RazorpayOrderResponse` from POST /orders/create */
export interface CreateOrderResponse {
  order_id: number
  order_number: string
  razorpay_order_id: string
  amount: number
  currency?: string
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  order_id: number
}

export interface VerifyPaymentResponse {
  status: string
  order_id?: number
  order_number?: string | null
  message?: string
}

export interface OrderMember {
  member_id: number
  name: string
  relation: string
  age: number
  gender: string
  /** Present when the list API includes contact on the member payload */
  mobile?: string
}

export interface OrderAddress {
  address_id: number
  address_label: string
  street_address: string
  city: string
  state: string
  postal_code: string
}

export interface OrderMemberAddressRow {
  member: OrderMember
  address: OrderAddress
  order_item_id: number
  order_status: string
  scheduled_date: string | null
  /** Timestamp of the most recent status transition for this item (ISO string). */
  status_updated_at?: string | null
  /** Which Thyrocare lab booking this row belongs to (for multi-pack / multi-visit). */
  thyrocare_order_id?: string
}

export interface OrderItem {
  product_id: number
  product_name: string
  group_id: string
  member_ids: number[]
  total_amount: number
  /** Single lab order id when the whole line maps to one Thyrocare booking. */
  thyrocare_order_id?: string
  /** Multiple lab visits for this product line (e.g. split bookings). */
  thyrocare_order_ids?: string[]
  member_address_map: OrderMemberAddressRow[]
}

export interface Order {
  /** Internal id when returned by GET /orders/{order_number} (optional; enables my-orders filters, etc.). */
  order_id?: number
  order_number: string
  razorpay_order_id: string
  thyrocare_order_id?: string
  total_amount: number
  subtotal: number
  discount: number
  order_status: string
  payment_status: string
  payment_method: string
  payment_method_details: string
  created_at: string
  order_date: string
  items: OrderItem[]
}

function uniqThyrocareOrderIds(ids: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const s of ids) {
    const t = String(s ?? '').trim()
    if (!t || seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}

/**
 * Unique Thyrocare lab order ids for one order line (product / pack):
 * `thyrocare_order_ids`, line-level `thyrocare_order_id`, then each `member_address_map` row.
 */
export function thyrocareIdsForOrderItem(item: OrderItem): string[] {
  const ids: string[] = []
  if (Array.isArray(item.thyrocare_order_ids)) {
    for (const x of item.thyrocare_order_ids) {
      if (typeof x === 'string' && x.trim()) ids.push(x.trim())
    }
  }
  if (typeof item.thyrocare_order_id === 'string' && item.thyrocare_order_id.trim()) {
    ids.push(item.thyrocare_order_id.trim())
  }
  for (const row of item.member_address_map ?? []) {
    const v = row.thyrocare_order_id?.trim()
    if (v) ids.push(v)
  }
  return uniqThyrocareOrderIds(ids)
}

/** Earliest non-null scheduled_date across all line items (not only items[0]). */
export function getEarliestScheduledDate(order: Order): string | null {
  let best: string | null = null
  let bestTime = Infinity
  for (const it of order.items) {
    for (const row of it.member_address_map) {
      const d = row.scheduled_date
      if (!d) continue
      const t = new Date(d).getTime()
      if (Number.isNaN(t)) continue
      if (t < bestTime) {
        bestTime = t
        best = d
      }
    }
  }
  return best
}

/** Row from `GET /thyrocare/orders/my-orders` (`data[]`). */
export interface ThyrocareMyOrderStatusEvent {
  order_status?: string
  order_status_description?: string
  timestamp?: string
  received_at?: string
}

export interface ThyrocareMyOrderRow {
  thyrocare_order_id: string
  our_order_id: number
  ref_order_no?: string
  order_item_ids?: number[]
  thyrocare_product_id?: number
  thyrocare_catalog_product_id?: string
  thyrocare_product_name?: string
  current_order_status: string | null
  current_status_description?: string | null
  appointment_date?: string | null
  phlebo_name?: string | null
  phlebo_contact?: string | null
  last_updated?: string | null
  member_ids?: number[]
  status_history: ThyrocareMyOrderStatusEvent[]
}

/** Normalize vendor status tokens for dictionary lookup. */
function normalizeThyrocareStatusCode(input: string): string {
  return input.trim().toUpperCase().replace(/[\s-]+/g, '_')
}

/**
 * Single dictionary for all Thyrocare-facing API statuses (my-orders + order-details).
 * Extend here when the backend adds new `order_status_description` / status codes.
 */
/** Do not map to “Order booked” — Nucleotide order supplies that; treat as no vendor label. */
const THYROCARE_STATUS_IGNORE_FOR_MAPPING = new Set(['YET_TO_ASSIGN', 'YET_TO_ASSIGNED', 'STARTED', 'ARRIVED'])

const THYROCARE_STATUS_LABEL_BY_CODE: Record<string, string> = {
  ORDER_BOOKED: 'Order booked',
  ORDER_CREATED: 'Order booked',
  ORDER_PLACED: 'Order booked',
  BOOKED: 'Order booked',
  PENDING_ASSIGNMENT: 'Order booked',
  PENDING: 'Order booked',
  NEW: 'Order booked',

  ASSIGNED: 'Technician assigned',

  TSP_ASSIGNED: 'Sample collected',
  PHLEBO_ASSIGNED: 'Sample collected',
  OUT_FOR_COLLECTION: 'Sample collected',
  SAMPLE_COLLECTED: 'Sample collected',
  COLLECTION_DONE: 'Sample collected',
  COLLECTED: 'Sample collected',
  SERVICE_COMPLETED: 'Sample collected',
  SERVICED: 'Sample collected',

  APPOINTMENT_DATE: 'Sample received by lab',
  APPOINTMENT: 'Sample received by lab',
  SAMPLE_IMPORTED: 'Sample received by lab',
  SAMPLE_IMPORT: 'Sample received by lab',
  SAMPLE_RECEIVED: 'Sample received by lab',
  SAMPLE_RECEIVED_BY_LAB: 'Sample received by lab',
  LAB_RECEIVED: 'Sample received by lab',
  IMPORTED: 'Sample received by lab',
  IMPORTED_TO_LAB: 'Sample received by lab',
  RECEIVED_AT_LAB: 'Sample received by lab',
  AT_LAB: 'Sample received by lab',
  SAMPLE_AT_LAB: 'Sample received by lab',

  PROCESSING: 'Processing',
  IN_PROCESS: 'Processing',
  IN_PROGRESS: 'Processing',
  UNDER_PROCESSING: 'Processing',

  REPORT_FULL: 'Report ready',
  REPORT_READY: 'Report ready',
  REPORT_GENERATED: 'Report ready',
  COMPLETED: 'Report ready',
  DONE: 'Report ready',
  CLOSED: 'Report ready',

  CANCELLED: 'Cancelled',
  CANCELED: 'Cancelled',
}

const THYROCARE_STATUS_LABEL_BY_PHRASE: Record<string, string> = {
  'order booked': 'Order booked',
  assigned: 'Sample collected',
  'sample collected': 'Sample collected',
  'serviced': 'Sample collected',
  'phlebo assigned': 'Sample collected',
  scheduled: 'Sample received by lab',
  imported: 'Sample received by lab',
  'sample imported': 'Sample received by lab',
  'sample received': 'Sample received by lab',
  'sample received by lab': 'Sample received by lab',
  processing: 'Processing',
  'under processing': 'Processing',
  'in progress': 'Processing',
  done: 'Report ready',
  'report ready': 'Report ready',
  'report full': 'Report ready',
  completed: 'Report ready',
  cancelled: 'Cancelled',
  canceled: 'Cancelled',
}

function thyrocareStatusMaybeCodeFromText(statusRaw: string): string | null {
  if (!statusRaw) return null
  const t = statusRaw.trim()
  if (/^[A-Z0-9_]+$/.test(t)) return normalizeThyrocareStatusCode(t)
  return null
}

/**
 * Map Thyrocare API `order_status_description` + `order_status` to user-facing copy for **any** order/booking.
 * Used for timeline rows, current status line, and anywhere else the vendor sends these fields.
 */
export function thyrocareApiStatusDisplayLabel(
  orderStatusDescription?: string | null,
  orderStatus?: string | null,
  fallback: string = '',
): string {
  const codeFromDesc =
    orderStatusDescription != null && String(orderStatusDescription).trim()
      ? normalizeThyrocareStatusCode(String(orderStatusDescription))
      : ''

  const statusRaw = orderStatus != null ? String(orderStatus).trim() : ''
  const statusPhrase = statusRaw.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim()

  const descIgnored = codeFromDesc !== '' && THYROCARE_STATUS_IGNORE_FOR_MAPPING.has(codeFromDesc)

  if (codeFromDesc && !descIgnored && THYROCARE_STATUS_LABEL_BY_CODE[codeFromDesc]) {
    return THYROCARE_STATUS_LABEL_BY_CODE[codeFromDesc]
  }

  const codeFromStatus = thyrocareStatusMaybeCodeFromText(statusRaw)
  const statusIgnored =
    codeFromStatus != null && THYROCARE_STATUS_IGNORE_FOR_MAPPING.has(codeFromStatus)

  if (codeFromStatus && !statusIgnored && THYROCARE_STATUS_LABEL_BY_CODE[codeFromStatus]) {
    return THYROCARE_STATUS_LABEL_BY_CODE[codeFromStatus]
  }

  const phraseIgnored = statusPhrase === 'yet to assign'

  if (statusPhrase && !phraseIgnored && THYROCARE_STATUS_LABEL_BY_PHRASE[statusPhrase]) {
    return THYROCARE_STATUS_LABEL_BY_PHRASE[statusPhrase]
  }

  const fb = fallback.trim()
  if (fb) return fb
  if (statusRaw && !phraseIgnored && !statusIgnored) return statusRaw
  if (codeFromDesc && !descIgnored) return codeFromDesc.replace(/_/g, ' ')
  return '—'
}

/** One timeline history row from my-orders or order-details `status_history`. */
export function thyrocareHistoryStepDisplayLabel(historyRow: unknown, fallbackLabel: string): string {
  if (historyRow == null || typeof historyRow !== 'object') {
    return fallbackLabel
  }
  const r = historyRow as Record<string, unknown>
  const desc =
    r.order_status_description ?? r.status_code ?? r.orderStatusDescription ?? r.statusCode
  const st = r.order_status ?? r.status ?? r.label
  const mapped = thyrocareApiStatusDisplayLabel(
    desc != null ? String(desc) : null,
    st != null ? String(st) : null,
    '',
  )
  if (mapped && mapped !== '—') return mapped
  return fallbackLabel
}

/** Timestamp string from a vendor status-history row (field names vary by API). */
export function thyrocareHistoryEventTimestamp(ev: Record<string, unknown>): string | null {
  const ts =
    ev.timestamp ??
    ev.received_at ??
    ev.created_at ??
    ev.updated_at ??
    ev.event_time ??
    ev.occurred_at ??
    ev.status_date ??
    ev.date
  if (ts == null) return null
  const s = String(ts).trim()
  return s || null
}

/**
 * Prefer the **Sample collected** (serviced / collection) event from order status history; then top-level
 * collection fields; then latest `sample_date` on nested report lines.
 */
export function pickSampleCollectedTimestampFromReport(row: MyReportRow | null): string | null {
  if (!row) return null
  const historyKeys = [
    'status_history',
    'order_status_history',
    'statusHistory',
    'thyrocare_status_history',
  ] as const
  const fromHistory: string[] = []
  for (const hk of historyKeys) {
    const arr = row[hk]
    if (!Array.isArray(arr)) continue
    for (const ev of arr) {
      if (ev == null || typeof ev !== 'object') continue
      const e = ev as Record<string, unknown>
      if (thyrocareHistoryStepDisplayLabel(e, '') !== 'Sample collected') continue
      const t = thyrocareHistoryEventTimestamp(e)
      if (t) fromHistory.push(t)
    }
  }
  if (fromHistory.length) {
    let best = fromHistory[0]!
    let bestMs = new Date(best).getTime()
    for (let i = 1; i < fromHistory.length; i++) {
      const c = fromHistory[i]!
      const ms = new Date(c).getTime()
      if (!Number.isNaN(ms) && (Number.isNaN(bestMs) || ms >= bestMs)) {
        best = c
        bestMs = ms
      }
    }
    return best
  }
  const topKeys = [
    'sample_collected_at',
    'sample_collected_date',
    'collection_completed_at',
    'collected_at',
    'collection_date',
    'sample_collection_time',
    'serviced_at',
    'service_completed_at',
  ] as const
  for (const k of topKeys) {
    const v = row[k]
    if (v != null && String(v).trim()) return String(v).trim()
  }
  const results = row.results
  if (Array.isArray(results)) {
    let best: string | null = null
    let bestMs = -Infinity
    for (const item of results) {
      if (item == null || typeof item !== 'object') continue
      const o = item as Record<string, unknown>
      const sd = o.sample_date ?? o.sampleDate
      if (sd == null || !String(sd).trim()) continue
      const s = String(sd).trim()
      const ms = new Date(s).getTime()
      if (!Number.isNaN(ms) && ms >= bestMs) {
        bestMs = ms
        best = s
      }
    }
    if (best) return best
  }
  return null
}

/**
 * Thyrocare rows that duplicate “Order booked” from the Nucleotide orders table (prepend that step once).
 * `YET_TO_ASSIGN` is dropped here (ignored for mapping) and not shown as its own milestone.
 */
const THYROCARE_ORDER_BOOKED_DEDUPE_CODES = new Set([
  'ORDER_BOOKED',
  'ORDER_CREATED',
  'BOOKED',
  'YET_TO_ASSIGN',
  'YET_TO_ASSIGNED',
  'PENDING_ASSIGNMENT',
  'PENDING',
  'NEW',
])

function historyRowDescriptionIsOrderBookedDup(descRaw: string): boolean {
  return THYROCARE_ORDER_BOOKED_DEDUPE_CODES.has(normalizeThyrocareStatusCode(descRaw))
}

function historyRowStatusIsOrderBookedDup(s: string): boolean {
  const phrase = s.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
  if (phrase === 'yet to assign' || phrase === 'order booked') return true
  const maybeCode = thyrocareStatusMaybeCodeFromText(s)
  return maybeCode != null && THYROCARE_ORDER_BOOKED_DEDUPE_CODES.has(maybeCode)
}

/**
 * True when this `status_history` row should not be shown because we prepend
 * “Order booked” from the confirmed Nucleotide order. If both description and status exist,
 * both must be dup/ignore-style so we do not drop a real event when one field is stale.
 */
export function isThyrocareOrderPlacedDuplicateHistoryRow(row: unknown): boolean {
  if (row == null || typeof row !== 'object') return false
  const r = row as Record<string, unknown>
  const descRaw = r.order_status_description ?? r.status_code ?? r.orderStatusDescription ?? r.statusCode
  const st = r.order_status ?? r.status
  const hasDesc = descRaw != null && String(descRaw).trim()
  const hasSt = st != null && String(st).trim()
  const descDup = hasDesc && historyRowDescriptionIsOrderBookedDup(String(descRaw))
  const stDup = hasSt && historyRowStatusIsOrderBookedDup(String(st))
  if (hasDesc && hasSt) return descDup && stDup
  if (hasDesc) return descDup
  if (hasSt) return stDup
  return false
}

function isThyrocarePlaceholderDescriptionField(descRaw: string): boolean {
  return THYROCARE_ORDER_BOOKED_DEDUPE_CODES.has(normalizeThyrocareStatusCode(descRaw))
}

function isThyrocarePlaceholderStatusField(statusRaw: string): boolean {
  const phrase = statusRaw.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
  if (phrase === 'yet to assign' || phrase === 'order booked') return true
  const codeFrom = thyrocareStatusMaybeCodeFromText(statusRaw)
  return codeFrom != null && THYROCARE_ORDER_BOOKED_DEDUPE_CODES.has(codeFrom)
}

/**
 * True when my-orders current fields are empty or only “yet to assign” / booked-style noise.
 * If one field is real (e.g. lab status) and the other is placeholder, this is false.
 */
export function isThyrocareVendorPlaceholderCurrentStatus(
  orderStatusDescription?: string | null,
  orderStatus?: string | null,
): boolean {
  const descRaw = orderStatusDescription != null && String(orderStatusDescription).trim()
    ? String(orderStatusDescription)
    : ''
  const statusRaw = orderStatus != null ? String(orderStatus).trim() : ''
  if (!descRaw && !statusRaw) return true
  const descPh = !descRaw || isThyrocarePlaceholderDescriptionField(descRaw)
  const stPh = !statusRaw || isThyrocarePlaceholderStatusField(statusRaw)
  return descPh && stPh
}

/**
 * Status line: skip placeholder my-orders so a stale “yet to assign” does not hide order-details.
 */
export function thyrocareCombinedStatusDisplayLabel(
  myRow?: { current_status_description?: string | null; current_order_status?: string | null } | null,
  d?: { current_status?: string | null; current_status_raw?: string | null } | null,
): string {
  const fromDetails = thyrocareApiStatusDisplayLabel(
    d?.current_status_raw ?? null,
    d?.current_status ?? null,
    '',
  )
  const skipMy =
    myRow == null ||
    isThyrocareVendorPlaceholderCurrentStatus(
      myRow.current_status_description,
      myRow.current_order_status,
    )
  if (!skipMy) {
    const fromMy = thyrocareApiStatusDisplayLabel(
      myRow.current_status_description,
      myRow.current_order_status,
      '',
    )
    if (fromMy && fromMy !== '—') return fromMy
  }
  if (fromDetails && fromDetails !== '—') return fromDetails
  return 'Order booked'
}

export function thyrocareMilestoneIndexForLabel(label: string): number {
  switch (label) {
    case 'Order placed':
    case 'Order booked': return 0
    case 'Sample collected': return 1
    case 'Sample received by lab': return 2
    case 'Processing': return 3
    case 'Report ready': return 4
    case 'Cancelled': return 4
    default: return 0
  }
}

/** Highest milestone 0–4 from API current status when `status_history` is empty. */
export function thyrocareMilestoneMaxIndex(
  orderStatusDescription?: string | null,
  orderStatus?: string | null,
): number {
  let maxIdx = 0

  const desc = orderStatusDescription != null && String(orderStatusDescription).trim()
    ? String(orderStatusDescription)
    : ''
  if (desc) {
    const code = normalizeThyrocareStatusCode(desc)
    const mapped = THYROCARE_STATUS_LABEL_BY_CODE[code]
    if (mapped) maxIdx = Math.max(maxIdx, thyrocareMilestoneIndexForLabel(mapped))
  }

  const statusRaw = orderStatus != null ? String(orderStatus).trim() : ''
  if (statusRaw) {
    const codeFrom = thyrocareStatusMaybeCodeFromText(statusRaw)
    if (codeFrom) {
      const mapped = THYROCARE_STATUS_LABEL_BY_CODE[codeFrom]
      if (mapped) maxIdx = Math.max(maxIdx, thyrocareMilestoneIndexForLabel(mapped))
    }
    const phrase = statusRaw.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
    const mappedPhrase = THYROCARE_STATUS_LABEL_BY_PHRASE[phrase]
    if (mappedPhrase) maxIdx = Math.max(maxIdx, thyrocareMilestoneIndexForLabel(mappedPhrase))
  }

  return Math.min(Math.max(maxIdx, 0), 4)
}

/** Combine my-orders + order-details current status for fallback stepper progress. */
export function thyrocareFallbackTimelineStage(
  myRow?: { current_status_description?: string | null; current_order_status?: string | null } | null,
  d?: { current_status?: string | null; current_status_raw?: string | null } | null,
): number {
  const a = myRow == null
    ? 0
    : thyrocareMilestoneMaxIndex(myRow.current_status_description, myRow.current_order_status)
  const b = thyrocareMilestoneMaxIndex(d?.current_status_raw ?? null, d?.current_status ?? null)
  return Math.min(Math.max(a, b), 4)
}

// Thyrocare live order details shape
export interface ThyrocareOrderDetails {
  order_number: string
  thyrocare_order_id: string
  current_status: string | null
  current_status_raw: string
  appointment_date: string | null
  phlebo: { name: string | null; contact: string | null }
  payment: {
    amount: number
    currency: string
    payment_status: string
    payment_method: string
    razorpay_payment_id: string
    payment_date: string
  }
  patients: any[]
  status_history: any[]
}

export async function fetchThyrocareReport(thyrocareOrderId: string, leadId: string): Promise<unknown> {
  const res = await api.get<any>(
    `/thyrocare/orders/${encodeURIComponent(thyrocareOrderId)}/reports/${encodeURIComponent(leadId)}?type=pdf`,
  )
  return res?.data ?? res
}

export async function downloadThyrocareReportPdfBlob(thyrocareOrderId: string, leadId: string): Promise<Blob> {
  return await api.getBlob(
    `/thyrocare/orders/${encodeURIComponent(thyrocareOrderId)}/reports/${encodeURIComponent(leadId)}?type=pdf`,
  )
}

export async function downloadPatientReport(patientId: string): Promise<unknown> {
  const res = await api.get<any>(`/thyrocare/reports/${encodeURIComponent(patientId)}/download`)
  return res?.data ?? res
}

export async function downloadPatientReportPdfBlob(patientId: string): Promise<Blob> {
  return await api.getBlob(`/thyrocare/reports/${encodeURIComponent(patientId)}/download`)
}

/** Extract a PDF/view URL from Thyrocare report API responses (several backend shapes). */
export function pickReportDownloadUrl(payload: unknown): string | null {
  const unwrap = (x: unknown): Record<string, unknown> | null => {
    if (x == null || typeof x !== 'object' || Array.isArray(x)) return null
    const r = x as Record<string, unknown>
    const d = r.data
    if (d != null && typeof d === 'object' && !Array.isArray(d)) {
      return { ...r, ...(d as Record<string, unknown>) }
    }
    return r
  }
  const r = unwrap(payload)
  if (!r) return null
  for (const k of [
    'url',
    'report_url',
    'download_url',
    'pdf_url',
    'file_url',
    'signed_url',
    'presigned_url',
    'link',
    'href',
  ]) {
    const v = r[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return null
}

export async function fetchOrders(memberId?: number): Promise<Order[]> {
  const qs = memberId != null ? `?member_id=${encodeURIComponent(String(memberId))}` : ''
  const res = await api.get<any>(`/orders/list${qs}`)
  if (Array.isArray(res)) return res
  return res?.data ?? res?.orders ?? []
}

/**
 * Single-order detail for the order-details screen (member-scoped payload when the API supports it).
 * Path: `GET /orders/{order_number}`.
 */
export async function fetchOrderByOrderNumber(orderNumber: string): Promise<Order> {
  const key = String(orderNumber ?? '').trim()
  if (!key) throw new Error('order_number required')
  const res = await api.get<any>(`/orders/${encodeURIComponent(key)}`)
  const raw = res?.data ?? res?.order ?? res
  if (!raw || typeof raw !== 'object') throw new Error('Invalid order response')
  return raw as Order
}

function asObjectRecord(v: unknown): Record<string, any> | null {
  return v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, any>) : null
}

/**
 * Vendor responses may wrap the payload (`data`) or put `status_history` on a nested `order`.
 * This keeps `status_history` on the object the UI reads.
 */
function normalizeThyrocareOrderDetailsPayload(raw: unknown): ThyrocareOrderDetails {
  const top = asObjectRecord(raw) ?? {}
  const fromData = asObjectRecord(top.data)
  const merged: Record<string, any> = { ...top, ...(fromData ?? {}) }
  const order = asObjectRecord(merged.order)
  const orderDetails = asObjectRecord(merged.order_details)

  const historyCandidates = [
    merged.status_history,
    merged.statusHistory,
    merged.timeline,
    order?.status_history,
    orderDetails?.status_history,
    merged.tracking?.history,
    merged.tracking_history,
  ]

  let status_history: any[] = []
  for (const c of historyCandidates) {
    if (Array.isArray(c)) {
      status_history = c
      break
    }
  }

  return { ...merged, status_history } as ThyrocareOrderDetails
}

export async function fetchOrderByThyrocareId(thyrocareOrderId: string): Promise<ThyrocareOrderDetails> {
  const res = await api.get<any>(`/thyrocare/orders/${thyrocareOrderId}/order-details`)
  const raw = res?.data ?? res
  return normalizeThyrocareOrderDetailsPayload(raw)
}

/** Alias (new naming): fetch Thyrocare live order details for a Thyrocare order id. */
export async function fetchThyrocareOrderDetails(thyrocareOrderId: string): Promise<ThyrocareOrderDetails> {
  return fetchOrderByThyrocareId(thyrocareOrderId)
}

/**
 * All lab bookings for the logged-in user. Prefer `status_history` here for timelines
 * when present; still use order-details for patients/reports if needed.
 */
export async function fetchThyrocareMyOrders(memberId?: number): Promise<ThyrocareMyOrderRow[]> {
  const qs = memberId != null ? `?member_id=${encodeURIComponent(String(memberId))}` : ''
  const res = await api.get<any>(`/thyrocare/orders/my-orders${qs}`)
  const raw = res?.data ?? res
  if (Array.isArray(raw)) return raw as ThyrocareMyOrderRow[]
  if (Array.isArray(raw?.data)) return raw.data as ThyrocareMyOrderRow[]
  return []
}

/** Row from `GET /thyrocare/reports/my-reports` (IDs normalized to `patient_id` + `order_id` where possible). */
export type MyReportRow = Record<string, unknown>

function normalizeMyReportsPayload(res: unknown): MyReportRow[] {
  if (res == null) return []
  const r = res as Record<string, unknown>
  const raw = r.data ?? r.reports ?? r.results ?? res
  if (Array.isArray(raw)) return raw as MyReportRow[]
  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj?.data)) return obj.data as MyReportRow[]
  if (Array.isArray(obj?.reports)) return obj.reports as MyReportRow[]
  if (Array.isArray(obj?.results)) return obj.results as MyReportRow[]
  return []
}

/**
 * API shape `{ member_id, results: [...] }`: lift patient / order / date / title from line items
 * so list keys and headers work. Does not treat `member_id` as lab `patient_id`.
 */
function enrichMyReportRowFromNestedResults(r: MyReportRow): MyReportRow {
  const results = r.results
  if (!Array.isArray(results) || results.length === 0) return { ...r }
  const lines = results.filter((x): x is Record<string, unknown> => x != null && typeof x === 'object' && !Array.isArray(x))
  if (lines.length === 0) return { ...r }
  const out = { ...r } as MyReportRow

  const pickFirst = (keys: string[]): unknown => {
    for (const line of lines) {
      for (const k of keys) {
        const v = line[k]
        if (v != null && String(v).trim()) return v
      }
    }
    return undefined
  }

  if (out.patient_name == null || String(out.patient_name).trim() === '') {
    const v = pickFirst(['patient_name', 'member_name', 'patientName', 'beneficiary_name', 'full_name'])
    if (v != null) out.patient_name = v
  }
  if (out.lead_id == null || String(out.lead_id).trim() === '') {
    const v = pickFirst(['lead_id', 'leadId'])
    if (v != null) out.lead_id = v
  }
  if (out.patient_id == null || String(out.patient_id).trim() === '') {
    const v = pickFirst(['patient_id', 'patientId', 'lead_id', 'leadId'])
    if (v != null) out.patient_id = v
  }
  if (out.our_order_id == null || String(out.our_order_id).trim() === '') {
    const v = pickFirst(['our_order_id', 'ourOrderId', 'nucleotide_order_id', 'nucleotideOrderId', 'internal_order_id', 'internalOrderId'])
    if (v != null) out.our_order_id = v
  }
  if (out.order_number == null || String(out.order_number).trim() === '') {
    const v = pickFirst(['nucleotide_order_number', 'nucleotideOrderNumber', 'order_number', 'orderNumber'])
    if (v != null) out.order_number = v
  }
  if (out.order_no == null || String(out.order_no).trim() === '') {
    const v = pickFirst(['order_no', 'orderNo'])
    if (v != null) out.order_no = v
  }
  if (out.thyrocare_order_id == null || String(out.thyrocare_order_id).trim() === '') {
    const v = pickFirst(['thyrocare_order_id', 'thyrocareOrderId'])
    if (v != null) out.thyrocare_order_id = v
  }
  if (out.report_date == null && out.completed_at == null) {
    const v = pickFirst(['sample_date', 'sampleDate'])
    if (v != null) out.report_date = v
  }
  const groups = [...new Set(lines.map(l => String(l.report_group ?? '').trim()).filter(Boolean))]
  if (groups.length && out.test_name == null && out.product_name == null && out.package_name == null) {
    out.product_name = groups.join(', ')
  }
  return out
}

/** Map vendor fields onto canonical `patient_id` and `order_id` for UI + routing. */
function attachCanonicalPatientAndOrderIds(r: MyReportRow): MyReportRow {
  const patientRaw = r.patient_id ?? r.patientId ?? r.lead_id ?? r.leadId
  const orderRaw =
    r.our_order_id ??
    r.ourOrderId ??
    r.nucleotide_order_id ??
    r.nucleotideOrderId ??
    r.internal_order_id ??
    r.internalOrderId ??
    r.nucleotide_order_number ??
    r.nucleotideOrderNumber ??
    r.order_number ??
    r.order_id ??
    r.orderId ??
    r.order_no ??
    r.ref_order_no

  const out = { ...r } as MyReportRow
  if (patientRaw != null && String(patientRaw).trim() && out.patient_id == null) {
    out.patient_id = patientRaw
  }
  if (orderRaw != null && String(orderRaw).trim() && out.order_id == null) {
    out.order_id = orderRaw
  }
  return out
}

function mapThyrocareMyOrdersToReportRows(rows: ThyrocareMyOrderRow[]): MyReportRow[] {
  return rows.map(r => {
    const status = r.current_status_description ?? r.current_order_status ?? ''
    const mid = r.member_ids?.[0]
    return {
      thyrocare_order_id: r.thyrocare_order_id,
      our_order_id: r.our_order_id,
      order_id: r.our_order_id,
      patient_id: mid != null ? mid : undefined,
      ref_order_no: r.ref_order_no,
      order_number: r.ref_order_no,
      test_name: r.thyrocare_product_name,
      product_name: r.thyrocare_product_name,
      patient_name: undefined,
      status,
      report_date: r.last_updated,
      source: 'nucleotide',
    } as MyReportRow
  })
}

/** Order number from Nucleotide / orders table only (not Thyrocare `order_no` / `ref_order_no`). */
export function getNucleotideOrderDisplayLabel(r: MyReportRow | null): string {
  if (!r) return ''
  const pick = (...vals: unknown[]): string => {
    for (const v of vals) {
      if (v != null && String(v).trim()) return String(v).trim()
    }
    return ''
  }
  return pick(
    r.our_order_id,
    r.ourOrderId,
    r.nucleotide_order_id,
    r.nucleotideOrderId,
    r.internal_order_id,
    r.internalOrderId,
    r.nucleotide_order_number,
    r.nucleotideOrderNumber,
    r.order_number,
    r.orderNumber,
  )
}

/** Segment used in report URL keys: Nucleotide id when present, else vendor refs for stability. */
export function getOrderOidSegmentForReportKey(r: MyReportRow): string {
  const n = getNucleotideOrderDisplayLabel(r)
  if (n) return n
  return String(
    r.order_id ?? r.orderId ?? r.order_no ?? r.ref_order_no ?? r.nucleotide_order_id ?? '',
  ).trim()
}

/**
 * Stable key for list + `/report?id=…`.
 * Prefers `member_id:patient_id:order_id` when member + lab patient + order exist (Nucleotide member vs Thyrocare patient).
 * Otherwise `order_id:patient_id`, then fallbacks.
 */
export function getMyReportRowKey(r: MyReportRow, index: number): string {
  const pid = String(r.patient_id ?? r.patientId ?? r.lead_id ?? r.leadId ?? '').trim()
  const oid = getOrderOidSegmentForReportKey(r)
  const midRaw = r.member_id ?? r.memberId
  const mid =
    midRaw != null && String(midRaw).trim() !== '' ? String(midRaw).trim() : ''
  if (mid && pid && oid) return `${mid}:${pid}:${oid}`
  if (oid && pid) return `${oid}:${pid}`
  if (oid) return oid
  if (pid) return pid
  const single = String(r.id ?? r.report_id ?? r.thyrocare_order_id ?? '').trim()
  if (single) return single
  return `idx-${Math.max(0, index)}`
}

/**
 * User’s report list for the Reports hub.
 * Primary: `GET /thyrocare/reports/my-reports` (see deployed API on App Runner).
 * On 404 only, falls back to `GET /thyrocare/orders/my-orders`.
 */
export async function fetchMyReports(memberId?: number): Promise<MyReportRow[]> {
  try {
    const qs = memberId != null ? `?member_id=${encodeURIComponent(String(memberId))}` : ''
    const res = await api.get<any>(`/thyrocare/reports/my-reports${qs}`)
    const labRows = normalizeMyReportsPayload(res)
      .map(enrichMyReportRowFromNestedResults)
      .map(attachCanonicalPatientAndOrderIds)
    // External uploads (best-effort; older backends may not have this).
    let uploaded: MyReportRow[] = []
    try {
      uploaded = normalizeMyReportsPayload(await fetchUploadedReports(memberId))
        .map(enrichMyReportRowFromNestedResults)
        .map(attachCanonicalPatientAndOrderIds)
    } catch {
      uploaded = []
    }
    const normalizeUploadedPath = (raw: string): string => {
      let s = String(raw ?? '').trim()
      if (!s) return ''
      // Remove query/hash
      s = s.split('#')[0]!.split('?')[0]!
      // If absolute URL, keep only pathname.
      if (/^https?:\/\//i.test(s)) {
        try {
          const u = new URL(s)
          s = u.pathname || ''
        } catch {
          // ignore parse errors
        }
      }
      // Normalize slashes + leading slash.
      s = s.replace(/\\/g, '/')
      if (s && !s.startsWith('/')) s = `/${s}`
      // Collapse duplicate slashes.
      s = s.replace(/\/{2,}/g, '/')
      return s
    }
    const dedupeKey = (r: MyReportRow, i: number): string => {
      // Prefer the same key we use for routing when it is stable.
      const k = getMyReportRowKey(r, i)
      if (k && !k.startsWith('idx-')) return k
      // Fallback for external uploads when ids are missing/renamed across endpoints.
      const rec = r as Record<string, unknown>
      const data =
        rec.data != null && typeof rec.data === 'object' && !Array.isArray(rec.data)
          ? (rec.data as Record<string, unknown>)
          : rec
      const mid = String((data.member_id ?? data.memberId ?? '') as any).trim()
      const name = String((data.report_name ?? data.file_name ?? data.fileName ?? '') as any).trim()
      const pathRaw = String((data.file_path ?? data.path ?? data.url ?? '') as any).trim()
      const path = normalizeUploadedPath(pathRaw)
      const created = String((data.created_at ?? data.uploaded_at ?? data.report_date ?? data.updated_at ?? data.timestamp ?? '') as any).trim()
      const id = String((data.upload_id ?? data.report_id ?? data.id ?? '') as any).trim()
      const size = String((data.file_size ?? data.size ?? '') as any).trim()
      // If we have a stored file path, it’s the strongest identity across endpoints.
      // This collapses duplicates where the same uploaded file is returned by both APIs.
      if (path) return ['uploaded', mid || '', path].filter(Boolean).join('|')
      return [id || '', mid || '', name || '', created || '', size || ''].filter(Boolean).join('|') || k
    }

    const merged = [...labRows, ...uploaded]
    const out: MyReportRow[] = []
    const seen = new Set<string>()
    for (let i = 0; i < merged.length; i++) {
      const row = merged[i]!
      const key = dedupeKey(row, i)
      if (seen.has(key)) continue
      seen.add(key)
      out.push(row)
    }
    return out
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status
    if (status === 404) {
      const myOrders = await fetchThyrocareMyOrders()
      return mapThyrocareMyOrdersToReportRows(myOrders).map(attachCanonicalPatientAndOrderIds)
    }
    throw e
  }
}

/**
 * Single report for `/report?id=…`. Composite ids (with `:` e.g. `member:patient:order`) are resolved via list fetch only.
 */
export async function fetchMyReportById(reportId: string): Promise<MyReportRow | null> {
  const id = String(reportId ?? '').trim()
  if (!id || id.includes(':')) return null
  const low = id.toLowerCase()
  if (low === 'order-detail' || low === 'order_detail' || low === 'context') return null
  const paths = [
    `/thyrocare/reports/my-reports/${encodeURIComponent(id)}`,
    `/thyrocare/reports/${encodeURIComponent(id)}`,
    `/thyrocare/myreports/${encodeURIComponent(id)}`,
  ]
  for (const path of paths) {
    try {
      const res = await api.get<any>(path)
      const top = res?.data ?? res?.report ?? res
      if (top != null && typeof top === 'object' && !Array.isArray(top)) {
        return attachCanonicalPatientAndOrderIds(top as MyReportRow)
      }
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) continue
      throw e
    }
  }
  return null
}

/** Cross-field hints when opening `/report` from order details (keys may not match list rows exactly). */
export type ReportLinkContext = {
  memberId?: number
  /** Thyrocare / lab patient or lead ids (any one may appear on the report row). */
  patientIds?: string[]
  nucleotideOrderNumber?: string
  nucleotideOrderId?: number
  thyrocareOrderId?: string
}

function normalizeOrderToken(s: string): string {
  return String(s ?? '')
    .trim()
    .replace(/^#+/i, '')
    .toUpperCase()
}

function reportRowPatientIdSet(r: MyReportRow): Set<string> {
  const out = new Set<string>()
  const add = (v: unknown) => {
    if (v != null && String(v).trim()) out.add(String(v).trim())
  }
  for (const k of ['patient_id', 'patientId', 'lead_id', 'leadId'] as const) {
    add(r[k])
  }
  const results = r.results
  if (Array.isArray(results)) {
    for (const line of results) {
      if (line == null || typeof line !== 'object' || Array.isArray(line)) continue
      const o = line as Record<string, unknown>
      for (const k of ['patient_id', 'patientId', 'lead_id', 'leadId']) {
        add(o[k])
      }
    }
  }
  return out
}

function reportRowMemberIdStr(r: MyReportRow): string {
  return String(r.member_id ?? r.memberId ?? '').trim()
}

function ctxOrderTokens(ctx: ReportLinkContext): Set<string> {
  const out = new Set<string>()
  if (ctx.nucleotideOrderNumber?.trim()) out.add(normalizeOrderToken(ctx.nucleotideOrderNumber))
  if (ctx.nucleotideOrderId != null && !Number.isNaN(Number(ctx.nucleotideOrderId))) {
    out.add(normalizeOrderToken(String(ctx.nucleotideOrderId)))
  }
  return out
}

function rowMatchesOrderContext(ctx: ReportLinkContext, r: MyReportRow): boolean {
  const hasNumericOid = ctx.nucleotideOrderId != null && !Number.isNaN(Number(ctx.nucleotideOrderId))
  const tokens = ctxOrderTokens(ctx)
  if (!hasNumericOid && tokens.size === 0) return true

  if (hasNumericOid) {
    const nid = Number(ctx.nucleotideOrderId)
    if (Number(r.our_order_id) === nid || Number(r.order_id) === nid) return true
  }
  if (tokens.size === 0) return false

  const candidates: unknown[] = [
    getOrderOidSegmentForReportKey(r),
    getNucleotideOrderDisplayLabel(r),
    r.order_number,
    r.orderNumber,
    r.order_id,
    r.orderId,
    r.our_order_id,
    r.ourOrderId,
    r.ref_order_no,
    r.order_no,
  ]
  for (const x of candidates) {
    if (x == null || String(x).trim() === '') continue
    if (tokens.has(normalizeOrderToken(String(x)))) return true
  }
  return false
}

function rowMatchesPatientContext(ctx: ReportLinkContext, r: MyReportRow): boolean {
  const want = (ctx.patientIds ?? []).map(s => String(s).trim()).filter(Boolean)
  if (want.length === 0) return true
  const have = reportRowPatientIdSet(r)
  for (const w of want) {
    if (have.has(w)) return true
    const nw = Number(w)
    if (w !== '' && Number.isFinite(nw)) {
      for (const h of have) {
        if (Number(h) === nw) return true
      }
    }
  }
  return false
}

function rowMatchesMemberContext(ctx: ReportLinkContext, r: MyReportRow): boolean {
  if (ctx.memberId == null) return true
  const rm = reportRowMemberIdStr(r)
  if (!rm) return true
  return rm === String(ctx.memberId) || Number(rm) === Number(ctx.memberId)
}

function rowMatchesThyrocareContext(ctx: ReportLinkContext, r: MyReportRow): boolean {
  const tc = ctx.thyrocareOrderId?.trim()
  if (!tc) return true
  const rowTc = String(r.thyrocare_order_id ?? r.thyrocareOrderId ?? '').trim()
  if (!rowTc) return true
  return rowTc === tc
}

/**
 * Find a report row using the same fields you can see on order details + My Reports
 * (member, lab patient/lead ids, Nucleotide order number/id, Thyrocare visit id).
 */
export function findMyReportByContext(rows: MyReportRow[], ctx: ReportLinkContext): MyReportRow | null {
  if (!rows.length) return null

  const predicates: Array<(r: MyReportRow) => boolean> = [
    r =>
      rowMatchesMemberContext(ctx, r) &&
      rowMatchesPatientContext(ctx, r) &&
      rowMatchesOrderContext(ctx, r) &&
      rowMatchesThyrocareContext(ctx, r),
    r =>
      rowMatchesMemberContext(ctx, r) &&
      rowMatchesPatientContext(ctx, r) &&
      rowMatchesOrderContext(ctx, r),
    r =>
      rowMatchesMemberContext(ctx, r) &&
      rowMatchesPatientContext(ctx, r) &&
      rowMatchesThyrocareContext(ctx, r),
    r => rowMatchesPatientContext(ctx, r) && rowMatchesOrderContext(ctx, r) && rowMatchesThyrocareContext(ctx, r),
    r => rowMatchesPatientContext(ctx, r) && rowMatchesOrderContext(ctx, r),
    r => rowMatchesMemberContext(ctx, r) && rowMatchesOrderContext(ctx, r) && rowMatchesThyrocareContext(ctx, r),
    r => rowMatchesMemberContext(ctx, r) && rowMatchesOrderContext(ctx, r),
    r =>
      rowMatchesMemberContext(ctx, r) &&
      rowMatchesPatientContext(ctx, r) &&
      rowMatchesThyrocareContext(ctx, r),
    r => rowMatchesMemberContext(ctx, r) && rowMatchesPatientContext(ctx, r),
  ]

  for (const pred of predicates) {
    const hit = rows.find(pred)
    if (hit) return hit
  }
  return null
}

/** Match a row from `fetchMyReports()` (same keys as {@link getMyReportRowKey}). */
export function findMyReportInList(rows: MyReportRow[], queryId: string): MyReportRow | null {
  const q = String(queryId).trim()
  if (!q) return null
  for (let i = 0; i < rows.length; i++) {
    if (getMyReportRowKey(rows[i]!, i) === q) return rows[i]!
  }
  const triple = q.split(':').map(s => s.trim()).filter(Boolean)
  if (triple.length === 3) {
    const [qMid, qPid, qOid] = triple
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]!
      const mid = String(r.member_id ?? r.memberId ?? '').trim()
      if (mid !== qMid) continue
      const oid = getOrderOidSegmentForReportKey(r)
      if (oid !== qOid) continue
      const pLab = String(r.patient_id ?? r.patientId ?? '').trim()
      const pLead = String(r.lead_id ?? r.leadId ?? '').trim()
      if (qPid === pLab || qPid === pLead) return r
    }
  }
  const legacy = q.split(':').map(s => s.trim()).filter(Boolean)
  if (legacy.length === 2) {
    const [seg0, seg1] = legacy
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]!
      const pid = String(r.patient_id ?? r.patientId ?? r.lead_id ?? r.leadId ?? '').trim()
      const oid = getOrderOidSegmentForReportKey(r)
      if (oid && pid && seg0 === oid && seg1 === pid) return r
    }
  }
  const keys = [
    'id',
    'report_id',
    'patient_id',
    'lead_id',
    'thyrocare_order_id',
    'order_id',
    'our_order_id',
  ]
  for (const r of rows) {
    for (const k of keys) {
      if (String(r[k] ?? '') === q) return r
    }
  }
  const m = /^idx-(\d+)$/.exec(q)
  if (m) {
    const i = Number(m[1])
    if (Number.isInteger(i) && i >= 0 && i < rows.length) return rows[i]!
  }
  return null
}

export async function createOrder(payload: PlaceOrderCreatePayload): Promise<CreateOrderResponse> {
  return api.post<CreateOrderResponse>('/orders/create', payload)
}

export async function verifyPayment(payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> {
  return api.post<VerifyPaymentResponse>('/orders/verify', payload)
}

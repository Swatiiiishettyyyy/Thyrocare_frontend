/**
 * First paint: GET /orders/{order_number} (query `order_number`, or nav state).
 * Per product: expand to load vendor order-details (internal ids never shown in UI).
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Navbar } from '../components'
import {
  fetchOrderByOrderNumber,
  fetchOrders,
  fetchThyrocareMyOrders,
  fetchThyrocareOrderDetails,
  fetchThyrocareReport,
  downloadPatientReport,
  pickReportDownloadUrl,
  getMyReportRowKey,
  getOrderOidSegmentForReportKey,
  thyrocareIdsForOrderItem,
  thyrocareCombinedStatusDisplayLabel,
  thyrocareHistoryStepDisplayLabel,
  thyrocareFallbackTimelineStage,
  thyrocareMilestoneIndexForLabel,
  isThyrocareOrderPlacedDuplicateHistoryRow,
} from '../api/orders'
import { API_BASE_URL } from '../api/client'
import type { Order, ThyrocareOrderDetails, ThyrocareMyOrderRow, OrderMemberAddressRow, OrderItem, MyReportRow, ReportLinkContext } from '../api/orders'
import { stashReportNavigation, newReportNavigationKey } from '../reportNavSession'
import backArrow from '../assets/figma/order-details/arrow.svg'
import orderCubeIcon from '../assets/figma/order-details/Frame-3.svg'
import emailIcon from '../assets/figma/order-details/Frame 29427.svg'
import phoneIcon from '../assets/figma/order-details/call.svg'
import tickIcon from '../assets/figma/order-details/icon.svg'
import fileIcon from '../assets/figma/order-details/file.svg'
import inAnalysisIcon from '../assets/figma/order-details/Frame (1).svg'

function normalizePersonName(s: string | undefined): string {
  return (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Match vendor timeline patient name to cart member row (scoped to same Thyrocare visit when possible). */
function resolveMemberIdForItemAndVisit(
  it: OrderItem,
  thyrocareVisitId: string | undefined,
  patientDisplayName: string | undefined,
  patientIndex?: number,
): number | undefined {
  const nameTarget = normalizePersonName(patientDisplayName)
  const tc = thyrocareVisitId?.trim()
  const rows = it.member_address_map ?? []
  if (rows.length === 0) return undefined
  if (!nameTarget) {
    if (patientIndex != null && rows[patientIndex]?.member?.member_id != null) {
      return rows[patientIndex]!.member.member_id
    }
    return rows.length === 1 ? rows[0]!.member.member_id : undefined
  }

  const matchRow = (preferTc: boolean) => {
    for (const row of rows) {
      const rowTc = row.thyrocare_order_id?.trim()
      if (preferTc && tc && rowTc && rowTc !== tc) continue
      if (normalizePersonName(row.member?.name) === nameTarget) return row.member.member_id
    }
    return undefined
  }
  const byName = matchRow(true) ?? matchRow(false)
  if (byName != null) return byName
  if (patientIndex != null && patientIndex >= 0 && patientIndex < rows.length) {
    return rows[patientIndex]!.member.member_id
  }
  return rows.length === 1 ? rows[0]!.member.member_id : undefined
}

/** Same fields the reports list uses for {@link getMyReportRowKey} / {@link getOrderOidSegmentForReportKey}. */
function buildReportSeedFromOrder(order: Order, labPatientId: string, memberId: number): MyReportRow {
  const row: MyReportRow = {
    member_id: memberId,
    patient_id: String(labPatientId).trim(),
  }
  if (order.order_id != null && String(order.order_id).trim() !== '') {
    const oid = Number(order.order_id)
    if (!Number.isNaN(oid)) {
      row.our_order_id = oid
      row.order_id = oid
    }
  }
  const on = order.order_number?.trim()
  if (on) row.order_number = on
  return row
}

/**
 * Some `my-reports` rows only expose `order_number` (display label skips numeric `our_order_id`).
 * When we have both, try this shape as an extra list key.
 */
function buildReportSeedOrderNumberOnly(order: Order, labPatientId: string, memberId: number): MyReportRow | null {
  const on = order.order_number?.trim()
  if (!on) return null
  return {
    member_id: memberId,
    patient_id: String(labPatientId).trim(),
    order_number: on,
  } as MyReportRow
}

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '#' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

const CARD: React.CSSProperties = {
  background: '#fff',
  boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
  borderRadius: 'clamp(14px, 1.6vmin, 16px)',
  outline: '1px solid #E7E1FF',
  outlineOffset: -1,
  padding: 'clamp(16px, 2.4vmin, 20px) clamp(16px, 2.8vmin, 24px)',
  boxSizing: 'border-box',
  width: '100%',
}
const LABEL: React.CSSProperties = { fontSize: 'var(--type-body)', color: '#828282', fontWeight: 400, lineHeight: 'var(--lh-body)' }
const VALUE: React.CSSProperties = { fontSize: 'var(--type-ui)', color: '#161616', fontWeight: 500, lineHeight: 'var(--lh-ui)' }
const SECTION_TITLE: React.CSSProperties = { fontSize: 'var(--type-ui)', fontWeight: 500, color: '#161616', marginBottom: 'clamp(8px, 1.2vmin, 10px)' }

function statusLabel(s: string | null | undefined) {
  const raw = String(s ?? '').trim()
  if (!raw) return '—'
  const u = raw.toUpperCase()
  if (u === 'CONFIRMED') return 'Confirmed'
  if (u === 'COMPLETED') return 'Completed'
  if (u === 'CANCELLED') return 'Cancelled'
  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b[a-z]/g, (m) => m.toUpperCase())
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatMemberGender(g: string | undefined) {
  const t = g?.trim()
  return t || '—'
}

function statusHistoryStepDone(s: Record<string, unknown>): boolean {
  if (typeof s.completed === 'boolean') return s.completed
  if (typeof s.done === 'boolean') return s.done
  if (typeof s.is_completed === 'boolean') return s.is_completed
  if (typeof s.is_current === 'boolean') return !s.is_current
  return true
}

/** Vendor payloads sometimes only send timestamps; try common text fields, then sensible fallbacks. */
function pickHistoryStepLabel(s: any): string {
  if (s == null) return ''
  if (typeof s === 'string') return s.trim()
  const candidates = [
    s.order_status,
    s.status,
    s.order_status_description,
    s.label,
    s.description,
    s.message,
    s.title,
    s.name,
    s.state,
    s.status_text,
    s.statusText,
    s.event,
    s.event_name,
    s.eventName,
    s.stage,
    s.remarks,
    s.note,
    s.text,
    s.activity,
    s.action,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
  }
  return ''
}

function normalizeHistoryTimestamp(v: unknown): string | null {
  if (v == null) return null
  const t = typeof v === 'string' ? v.trim() : String(v)
  if (!t) return null
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(t)) return t.replace(' ', 'T')
  return t
}

function mapStatusHistoryToSteps(
  history: any[],
): Array<{ label: string; time: string; done: boolean }> {
  return history.map((s: any, index: number) => {
    const timeRaw =
      normalizeHistoryTimestamp(s?.timestamp)
      ?? normalizeHistoryTimestamp(s?.time)
      ?? normalizeHistoryTimestamp(s?.received_at)
      ?? normalizeHistoryTimestamp(s?.created_at)
      ?? normalizeHistoryTimestamp(s?.updated_at)
    const time = timeRaw ? formatDateTime(timeRaw) : ''
    let label = pickHistoryStepLabel(s)
    if (!label && time) label = 'Status update'
    if (!label) label = `Step ${index + 1}`
    label = thyrocareHistoryStepDisplayLabel(s, label)
    return {
      label,
      time,
      done: statusHistoryStepDone(s as Record<string, unknown>),
    }
  })
}

function resolveHistoryForBooking(
  myRow: ThyrocareMyOrderRow | undefined,
  d: ThyrocareOrderDetails | undefined,
): any[] | null {
  const mh = myRow?.status_history
  if (Array.isArray(mh) && mh.length > 0) return mh
  const dh = d?.status_history
  if (Array.isArray(dh) && dh.length > 0) return dh
  return null
}

function fallbackVisitSteps(
  order: Order,
  myRow: ThyrocareMyOrderRow | undefined,
  d: ThyrocareOrderDetails | undefined,
): Array<{ label: string; time: string; done: boolean }> {
  const appt =
    myRow?.appointment_date
    ?? d?.appointment_date
    ?? (d as any)?.patients?.[0]?.appointment_date
  const stage = thyrocareFallbackTimelineStage(myRow ?? null, d ?? null)
  const labels = [
    'Order booked',
    'Sample collected',
    'Sample received by lab',
    'Processing',
    'Report ready',
  ] as const
  return labels.map((label, i) => ({
    label,
    time:
      i === 0
        ? formatDateTime(order.order_date || order.created_at)
        : i === 1 && appt
          ? formatDate(appt)
          : '',
    done: i <= stage,
  }))
}

function clientOnlyFallbackStage(input: {
  statusRaw: string | null | undefined
  scheduledDate?: string | null | undefined
}): number {
  const s = String(input.statusRaw ?? '').trim().toUpperCase()
  if (s === 'COMPLETED') return 4
  if (s === 'CANCELLED') return 0
  // Without vendor (Thyrocare) tracking, avoid showing intermediary milestones.
  return 0
}

/** When Thyrocare ids are missing, still show a reasonable timeline. */
function clientOnlyVisitSteps(
  order: Order,
  opts: { statusRaw: string | null | undefined; scheduledDate?: string | null | undefined },
): Array<{ label: string; time: string; done: boolean }> {
  const stage = clientOnlyFallbackStage(opts)
  const labels = [
    'Order booked',
    'Sample collected',
    'Sample received by lab',
    'Processing',
    'Report ready',
  ] as const
  return labels.map((label, i) => ({
    label,
    time:
      i === 0
        ? formatDateTime(order.order_date || order.created_at)
        : '',
    done: i <= stage,
  }))
}

/** Nucleotide “Order booked” from orders table first (every visit under this order number), then Thyrocare history with booking / YET TO ASSIGN rows deduped. */
function buildVisitStepsWithOrderBooked(
  order: Order,
  hist: any[] | null,
  myRow: ThyrocareMyOrderRow | undefined,
  d: ThyrocareOrderDetails | undefined,
): Array<{ label: string; time: string; done: boolean }> {
  if (!hist || hist.length === 0) {
    return fallbackVisitSteps(order, myRow, d)
  }

  // Compute the highest milestone (0-4) reached across all history rows + current status fields.
  // Renders the fixed 5-stage list with proper done/greyed states instead of raw DB rows.
  let maxStage = thyrocareFallbackTimelineStage(myRow, d)
  for (const row of hist) {
    const mapped = thyrocareHistoryStepDisplayLabel(row, '')
    if (mapped && mapped !== '—') {
      maxStage = Math.max(maxStage, thyrocareMilestoneIndexForLabel(mapped))
    }
  }

  const appt =
    myRow?.appointment_date
    ?? d?.appointment_date
    ?? (d as any)?.patients?.[0]?.appointment_date
  const labels = [
    'Order booked',
    'Sample collected',
    'Sample received by lab',
    'Processing',
    'Report ready',
  ] as const
  return labels.map((label, i) => ({
    label,
    time:
      i === 0
        ? formatDateTime(order.order_date || order.created_at)
        : i === 1 && appt
          ? formatDate(appt)
          : '',
    done: i <= maxStage,
  }))
}

/** Matches the timeline: current milestone = first incomplete step, else last step. */
function timelineHeadlineFromSteps(steps: Array<{ label: string; done: boolean }>): string {
  const active = steps.find(s => !s.done)
  if (active) return active.label
  return steps[steps.length - 1]?.label ?? '—'
}

function effectiveRowThyrocareId(row: OrderMemberAddressRow, itemStripIds: string[]): string | null {
  const r = row.thyrocare_order_id?.trim()
  if (r) return r
  if (itemStripIds.length === 1) return itemStripIds[0]!
  return null
}

export default function OrderDetailsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const state = (location.state as { order?: Order; orderNumber?: string } | null) ?? null

  const orderNumberKey = useMemo(() => {
    const q =
      searchParams.get('order_number')?.trim()
      || searchParams.get('orderNumber')?.trim()
      || ''
    const fromState =
      (typeof state?.orderNumber === 'string' ? state.orderNumber.trim() : '')
      || (state?.order?.order_number ? String(state.order.order_number).trim() : '')
    return q || fromState
  }, [searchParams, state?.orderNumber, state?.order?.order_number])

  const [order, setOrder] = useState<Order | null>(null)
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)

  const [thyrocareById, setThyrocareById] = useState<Record<string, ThyrocareOrderDetails>>({})
  const [thyrocareLoading, setThyrocareLoading] = useState<Record<string, boolean>>({})
  const [thyrocareErr, setThyrocareErr] = useState<Record<string, string | undefined>>({})
  const [expandedProducts, setExpandedProducts] = useState<Record<number, boolean>>({})
  const [reportLoading, setReportLoading] = useState<Record<string, boolean>>({})
  const [myOrderByTcId, setMyOrderByTcId] = useState<Record<string, ThyrocareMyOrderRow>>({})

  useEffect(() => {
    setThyrocareById({})
    setThyrocareLoading({})
    setThyrocareErr({})
    setExpandedProducts({})
    setMyOrderByTcId({})
  }, [orderNumberKey])

  useEffect(() => {
    if (!orderNumberKey) {
      setOrder(null)
      setOrderError(null)
      setOrderLoading(false)
      return
    }
    let cancelled = false
    setOrderLoading(true)
    setOrderError(null)

    const loadListFallback = () =>
      fetchOrders()
        .then(list => {
          if (cancelled) return
          const found = list.find(o => String(o.order_number ?? '').trim() === orderNumberKey)
          if (found) {
            setOrder(found)
            setOrderError(null)
          } else {
            setOrder(null)
            setOrderError('Order not found.')
          }
        })
        .catch(() => {
          if (!cancelled) {
            setOrder(null)
            setOrderError('Order not found.')
          }
        })
        .finally(() => {
          if (!cancelled) setOrderLoading(false)
        })

    fetchOrderByOrderNumber(orderNumberKey)
      .then(o => {
        if (!cancelled) {
          setOrder(o)
          setOrderLoading(false)
        }
      })
      .catch(() => {
        if (cancelled) {
          setOrderLoading(false)
          return
        }
        loadListFallback()
      })

    return () => { cancelled = true }
  }, [orderNumberKey])

  /** Detail GET sometimes omits internal `order_id`; list rows have it and report URL keys need it. */
  useEffect(() => {
    if (!order?.order_number?.trim() || order.order_id != null) return
    let cancelled = false
    fetchOrders()
      .then(list => {
        if (cancelled) return
        const found = list.find(o => String(o.order_number ?? '').trim() === String(order.order_number).trim())
        const oid = found?.order_id
        if (found && oid != null && String(oid).trim() !== '') {
          setOrder(prev =>
            prev && String(prev.order_number).trim() === String(order.order_number).trim()
              ? { ...prev, order_id: oid }
              : prev,
          )
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [order?.order_number, order?.order_id])

  useEffect(() => {
    if (!order?.items?.length) {
      setMyOrderByTcId({})
      return
    }
    let cancelled = false
    const allowed = new Set<string>()
    for (const it of order.items) {
      thyrocareIdsForOrderItem(it).forEach(raw => {
        const id = String(raw ?? '').trim()
        if (id) allowed.add(id)
      })
    }
    if (allowed.size === 0) {
      setMyOrderByTcId({})
      return
    }
    const oid = order.order_id
    fetchThyrocareMyOrders()
      .then(rows => {
        if (cancelled) return
        const next: Record<string, ThyrocareMyOrderRow> = {}
        for (const r of rows) {
          const tid = String(r.thyrocare_order_id ?? '').trim()
          if (!tid || !allowed.has(tid)) continue
          if (oid != null && Number(r.our_order_id) !== Number(oid)) continue
          if (!next[tid]) next[tid] = r
        }
        setMyOrderByTcId(next)
      })
      .catch(() => {
        if (!cancelled) setMyOrderByTcId({})
      })
    return () => { cancelled = true }
  }, [order?.order_number, order?.order_id])

  const allMemberMaps = order?.items.flatMap(it => it.member_address_map) ?? []
  const firstMember = allMemberMaps[0]?.member

  const ensureThyrocareLoaded = useCallback(async (tcId: string) => {
    const id = tcId.trim()
    if (!id || thyrocareById[id] || thyrocareLoading[id]) return
    setThyrocareLoading(prev => ({ ...prev, [id]: true }))
    setThyrocareErr(prev => ({ ...prev, [id]: undefined }))
    try {
      const d = await fetchThyrocareOrderDetails(id)
      setThyrocareById(prev => ({ ...prev, [id]: d }))
    } catch {
      setThyrocareErr(prev => ({ ...prev, [id]: 'Could not load timeline. Try again.' }))
    } finally {
      setThyrocareLoading(prev => ({ ...prev, [id]: false }))
    }
  }, [thyrocareById, thyrocareLoading])

  /** Billing summary should have live payment details without expanding timelines. */
  useEffect(() => {
    if (!order?.items?.length) return
    const ids: string[] = []
    for (const it of order.items) {
      for (const raw of thyrocareIdsForOrderItem(it)) {
        const id = String(raw ?? '').trim()
        if (id) ids.push(id)
      }
    }
    const primary = ids[0]
    if (primary) void ensureThyrocareLoaded(primary)
  }, [order?.order_number, order?.items, ensureThyrocareLoaded])

  const toggleProductTimeline = useCallback((itemIdx: number, stripIds: string[]) => {
    setExpandedProducts(prev => {
      const opening = !prev[itemIdx]
      if (opening) stripIds.forEach(tcId => { void ensureThyrocareLoaded(tcId) })
      return { ...prev, [itemIdx]: opening }
    })
  }, [ensureThyrocareLoaded])

  function openReportUrlInNewTab(url: string) {
    const t = url.trim()
    const abs =
      t.startsWith('http://') || t.startsWith('https://')
        ? t
        : `${API_BASE_URL}${t.startsWith('/') ? '' : '/'}${t}`
    const win = window.open(abs, '_blank', 'noopener,noreferrer')
    if (!win) window.location.assign(abs)
  }

  async function handleViewReport(
    patientId: string,
    opts?: {
      thyrocareOrderId?: string
      leadId?: string
      memberId?: number
      alternatePatientIds?: string[]
    },
  ) {
    const labPid = String(patientId).trim()
    const memberId = opts?.memberId
    const extra = (opts?.alternatePatientIds ?? []).map(x => String(x ?? '').trim()).filter(Boolean)
    const patientIdVariants = [labPid, ...extra].filter((x, i, a) => x && a.indexOf(x) === i)

    if (memberId != null && order && labPid) {
      const primarySeed = buildReportSeedFromOrder(order, labPid, memberId)
      const oidSeg = getOrderOidSegmentForReportKey(primarySeed)
      const reportLinkContext: ReportLinkContext = {
        memberId,
        patientIds: patientIdVariants,
        nucleotideOrderNumber: order.order_number,
        nucleotideOrderId: order.order_id,
        thyrocareOrderId: opts?.thyrocareOrderId?.trim(),
      }
      if (oidSeg) {
        const tryIds: string[] = []
        for (const pid of patientIdVariants) {
          tryIds.push(getMyReportRowKey(buildReportSeedFromOrder(order, pid, memberId), 0))
          const pub = buildReportSeedOrderNumberOnly(order, pid, memberId)
          if (pub && getOrderOidSegmentForReportKey(pub) !== oidSeg) {
            tryIds.push(getMyReportRowKey(pub, 0))
          }
        }
        const uniq = tryIds.filter((x, i, a) => x && a.indexOf(x) === i)
        if (uniq.length) {
          const lk = newReportNavigationKey()
          stashReportNavigation(lk, { report: primarySeed, reportTryIds: uniq, reportLinkContext })
          navigate(`/report?id=${encodeURIComponent(uniq[0]!)}&lk=${encodeURIComponent(lk)}`, {
            state: { report: primarySeed, reportTryIds: uniq, reportLinkContext },
          })
          return
        }
      }
      const lk = newReportNavigationKey()
      stashReportNavigation(lk, { report: primarySeed, reportTryIds: [], reportLinkContext })
      navigate(`/report?id=${encodeURIComponent('order-detail')}&lk=${encodeURIComponent(lk)}`, {
        state: { report: primarySeed, reportTryIds: [], reportLinkContext },
      })
      return
    }

    const key = String(patientId)
    setReportLoading(prev => ({ ...prev, [key]: true }))
    try {
      let url = pickReportDownloadUrl(await downloadPatientReport(key))
      if (!url && opts?.thyrocareOrderId && opts?.leadId) {
        url = pickReportDownloadUrl(
          await fetchThyrocareReport(opts.thyrocareOrderId, opts.leadId),
        )
      }
      if (url) openReportUrlInNewTab(url)
      else alert('Report not available yet.')
    } catch {
      if (opts?.thyrocareOrderId && opts?.leadId) {
        try {
          const url = pickReportDownloadUrl(
            await fetchThyrocareReport(opts.thyrocareOrderId, opts.leadId),
          )
          if (url) {
            openReportUrlInNewTab(url)
            return
          }
        } catch {
          /* fall through */
        }
      }
      alert('Could not fetch report. Please try again.')
    } finally {
      setReportLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  function resolvePatientIdForRow(
    entry: OrderMemberAddressRow,
    item: OrderItem,
    itemStripIds: string[],
  ): string | undefined {
    const tcRow = effectiveRowThyrocareId(entry, itemStripIds)
    const details = tcRow ? thyrocareById[tcRow] : undefined
    const patients: any[] = Array.isArray((details as any)?.patients) ? (details as any).patients : []
    const m = entry.member
    const match = patients.find((p: any) => String(p?.name ?? '').toLowerCase() === String(m?.name ?? '').toLowerCase())
    const p = match ?? (patients.length === 1 ? patients[0] : undefined)
    return p?.id ?? p?.lead_id ?? p?.patient_id
  }

  if (!orderNumberKey) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif' }}>
        <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" hideSearchOnMobile onCtaClick={() => navigate('/cart')} />
        <div style={{ padding: 40, textAlign: 'center', color: '#828282' }}>
          Missing order number. Open this page from Orders or add <code style={{ color: '#8B5CF6' }}>?order_number=…</code> to the URL.{' '}
          <button type="button" onClick={() => navigate('/orders')} style={{ color: '#8B5CF6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Back to Orders</button>
        </div>
      </div>
    )
  }

  if (orderLoading || (!order && !orderError)) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif' }}>
        <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" hideSearchOnMobile onCtaClick={() => navigate('/cart')} />
        <div style={{ padding: 40, textAlign: 'center', color: '#828282' }}>Loading order…</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif' }}>
        <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" hideSearchOnMobile onCtaClick={() => navigate('/cart')} />
        <div style={{ padding: 40, textAlign: 'center', color: '#828282' }}>
          {orderError ?? 'Order not found.'}{' '}
          <button type="button" onClick={() => navigate('/orders')} style={{ color: '#8B5CF6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Back to Orders</button>
        </div>
      </div>
    )
  }

  const heroEmail = String((order as any)?.email ?? (order as any)?.customer_email ?? '').trim()
  const heroPhone = String((order as any)?.mobile ?? (order as any)?.customer_mobile ?? firstMember?.mobile ?? '').trim()
  const showHeroContacts = firstMember && (heroEmail || heroPhone)

  const primaryThyrocareId = (() => {
    const ids: string[] = []
    for (const it of order.items ?? []) {
      for (const raw of thyrocareIdsForOrderItem(it)) {
        const id = String(raw ?? '').trim()
        if (id) ids.push(id)
      }
    }
    return ids[0]
  })()
  const primaryThyrocareDetails = primaryThyrocareId ? thyrocareById[primaryThyrocareId] : undefined
  const vendorPayment = (primaryThyrocareDetails as any)?.payment as
    | {
        amount?: number
        currency?: string
        payment_status?: string
        payment_method?: string
        razorpay_payment_id?: string
        payment_date?: string
      }
    | undefined

  const billingStripItems = [
    {
      label: 'Payment Mode',
      value:
        vendorPayment?.payment_method ??
        order.payment_method_details ??
        order.payment_method ??
        '—',
    },
    {
      label: 'Transaction Date',
      value: formatDateTime(vendorPayment?.payment_date ?? order.order_date ?? order.created_at),
    },
    { label: 'Security', value: 'AES-256 Encrypted' },
    {
      label: 'Invoice No',
      value:
        vendorPayment?.razorpay_payment_id?.trim()
          ? vendorPayment.razorpay_payment_id.trim()
          : `NUC-INV-${String(order.order_number ?? '').slice(-4).padStart(4, '0')}`,
    },
  ]

  return (
    <div className="order-detail-page" style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif', overflowX: 'hidden' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" hideSearchOnMobile onCtaClick={() => navigate('/cart')} />

      <div className="order-detail-inner" style={{}}>
        <div className="order-detail-bg" aria-hidden="true">
          <div className="order-detail-blob order-detail-blob--green" />
          <div className="order-detail-blob order-detail-blob--purple" />
        </div>

        <button
          type="button"
          onClick={() => navigate('/orders')}
          className="order-detail-backBtn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'clamp(10px, 1.2vmin, 16px)',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: '#161616',
            fontFamily: 'Inter, sans-serif',
            fontSize: 'var(--type-body)',
            lineHeight: 'var(--lh-body)',
          }}
        >
          <img src={backArrow} alt="" style={{ width: 'clamp(18px, 2.6vmin, 24px)', height: 'clamp(18px, 2.6vmin, 24px)', display: 'block' }} />
          Back to Orders
        </button>

        <div className="order-detail-stack" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 3vmin, 28px)', marginTop: 'clamp(14px, 2.2vmin, 20px)' }}>

          <div className="order-detail-hero" style={{
            background: 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
            borderRadius: 'clamp(14px, 1.8vmin, 16px)',
            padding: 'clamp(20px, 3vmin, 26px) clamp(16px, 3vmin, 24px)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'clamp(14px, 2.2vmin, 16px)',
          }}>
            <div className="order-detail-heroTop" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 'clamp(46px, 5.8vmin, 56px)',
                height: 'clamp(46px, 5.8vmin, 56px)',
                borderRadius: 999,
                outline: '1px solid rgba(139,92,246,0.35)',
                outlineOffset: -1,
                background: 'rgba(16, 17, 41, 0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <img src={orderCubeIcon} alt="" style={{ width: 'clamp(18px, 2.6vmin, 24px)', height: 'clamp(18px, 2.6vmin, 24px)', display: 'block' }} />
              </div>
              <div className="order-detail-heroTopText" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="order-detail-heroTitleRow" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span className="order-detail-heroTitle" style={{ fontSize: 'var(--type-ui)', fontWeight: 500, color: '#fff', lineHeight: 'var(--lh-ui)' }}>
                    Order #{order.order_number}
                  </span>
                  <span className="order-detail-heroStatusPill" style={{ padding: 'clamp(2px, 0.35vmin, 3px) clamp(10px, 1.2vmin, 10px)', background: '#5D48AC', borderRadius: 32, fontSize: 'var(--type-body)', color: '#F9F9F9', lineHeight: 'var(--lh-body)' }}>
                    {statusLabel(order.order_status)}
                  </span>
                </div>
                <span className="order-detail-heroSub" style={{ fontSize: 'var(--type-body)', color: 'rgba(255,255,255,0.62)', lineHeight: 'var(--lh-body)' }}>
                  Payment: {order.payment_status ?? '—'} · Total ₹{order.total_amount}
                </span>
              </div>
            </div>
            {showHeroContacts && (
              <div className="order-detail-heroContacts" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.4vmin, 10px)' }}>
                {heroEmail && (
                  <div className="order-detail-heroContactRow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img className="order-detail-heroContactIcon" src={emailIcon} alt="" style={{ width: 'clamp(14px, 1.8vmin, 16px)', height: 'clamp(14px, 1.8vmin, 16px)', display: 'block' }} />
                    <span className="order-detail-heroContactText" style={{ fontSize: 'var(--type-body)', color: '#F9F9F9', lineHeight: 'var(--lh-body)' }}>{heroEmail}</span>
                  </div>
                )}
                {heroPhone && (
                  <div className="order-detail-heroContactRow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img className="order-detail-heroContactIcon" src={phoneIcon} alt="" style={{ width: 'clamp(14px, 1.8vmin, 16px)', height: 'clamp(14px, 1.8vmin, 16px)', display: 'block' }} />
                    <span className="order-detail-heroContactText" style={{ fontSize: 'var(--type-body)', color: '#F9F9F9', lineHeight: 'var(--lh-body)' }}>{heroPhone}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={SECTION_TITLE}>Your tests</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {order.items.map((it, itemIdx) => {
                const stripIds = thyrocareIdsForOrderItem(it)
                const productOpen = !!expandedProducts[itemIdx]
                const canTrack = stripIds.length > 0
                return (
                  <div key={`${it.product_id}-${itemIdx}`} style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <button
                      type="button"
                      disabled={!canTrack}
                      onClick={() => canTrack && toggleProductTimeline(itemIdx, stripIds)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                        padding: 0,
                        border: 'none',
                        background: 'transparent',
                        cursor: canTrack ? 'pointer' : 'default',
                        textAlign: 'left',
                        fontFamily: 'Poppins, sans-serif',
                        opacity: canTrack ? 1 : 0.95,
                      }}
                    >
                      <span style={{ ...VALUE, fontSize: 'clamp(15px, 1.2vw, 17px)', flex: '1 1 200px' }}>
                        {it.product_name}
                        {canTrack && (
                          <span style={{ ...LABEL, marginLeft: 8, fontSize: 13 }}>
                            {productOpen ? ' ▾' : ' ▸'}
                          </span>
                        )}
                      </span>
                    </button>

                    {canTrack && productOpen && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {stripIds.map((tcId, vi) => {
                          const myRow = myOrderByTcId[tcId]
                          const d = thyrocareById[tcId]
                          const loading = !!thyrocareLoading[tcId]
                          const err = thyrocareErr[tcId]
                          const hist = resolveHistoryForBooking(myRow, d)
                          const visitSteps = buildVisitStepsWithOrderBooked(order, hist, myRow, d)
                          const patients: any[] = Array.isArray((d as any)?.patients) ? (d as any).patients : []
                          const phleboName = myRow?.phlebo_name?.trim() || d?.phlebo?.name?.trim()
                          const phleboContact = myRow?.phlebo_contact?.trim() || d?.phlebo?.contact?.trim()
                          const hasPhlebo = !!(phleboName || phleboContact)
                          const statusText = thyrocareCombinedStatusDisplayLabel(myRow, d)
                          const apptRaw =
                            myRow?.appointment_date
                            ?? d?.appointment_date
                            ?? (d as any)?.patients?.[0]?.appointment_date
                          const visitHeading = stripIds.length > 1 ? `Visit ${vi + 1}` : null
                          const hasPayload = !!(myRow || d)
                          const waitInitial = !hasPayload && loading
                          const showFetchErr = !hasPayload && !loading && err

                          return (
                            <div
                              key={`${itemIdx}-v-${vi}`}
                              style={{
                                border: '1px solid #E7E1FF',
                                borderRadius: 12,
                                padding: '14px 16px',
                                background: '#FAFAFF',
                              }}
                            >
                              {visitHeading && (
                                <div style={{ ...LABEL, color: '#161616', fontWeight: 500, marginBottom: 10 }}>{visitHeading}</div>
                              )}
                              {waitInitial && <div style={{ ...LABEL, padding: '4px 0' }}>Loading timeline…</div>}
                              {showFetchErr && <div style={{ color: '#B91C1C', fontSize: 13 }}>{err}</div>}
                              {(hasPayload || (!loading && !err)) && (
                                <>
                                  {apptRaw && (
                                    <div style={{ ...LABEL, marginBottom: 8 }}>
                                      Appointment: {formatDate(apptRaw)}
                                    </div>
                                  )}
                                  {hasPhlebo && (
                                    <div style={{ marginBottom: 12 }}>
                                      <div style={{ ...LABEL, marginBottom: 4 }}>Phlebotomist</div>
                                      {phleboName && <div style={VALUE}>{phleboName}</div>}
                                      {phleboContact && <div style={{ ...LABEL }}>{phleboContact}</div>}
                                    </div>
                                  )}
                                  {/* Current stage headline removed (timeline below is sufficient) */}
                                  <div className="order-detail-trackingCard" style={{ ...CARD, boxShadow: 'none', padding: '12px 0', background: 'transparent', outline: 'none' }}>
                                    <div className="order-detail-trackList">
                                      <div className="order-detail-trackLine" aria-hidden="true" />
                                      {visitSteps.map((step, i) => (
                                        <div key={`${itemIdx}-${vi}-s-${i}`} className="order-detail-trackRow">
                                          <div className="order-detail-trackMarker" data-done={step.done ? 'true' : 'false'} aria-hidden="true">
                                            {step.done && <img src={tickIcon} alt="" className="order-detail-trackTick" />}
                                          </div>
                                          <div className="order-detail-trackText">
                                            <div className="order-detail-trackLabel">{step.label}</div>
                                            {step.time && <div className="order-detail-trackTime">{step.time}</div>}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  {loading && !d && (
                                    <div style={{ ...LABEL, fontSize: 12, marginTop: 8 }}>Loading reports…</div>
                                  )}
                                  {patients.length > 0 && (
                                    <div style={{ marginTop: 12 }}>
                                      <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 8 }}>Reports</div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {patients.map((p: any, pi: number) => {
                                          const patientId: string | undefined = p?.id ?? p?.lead_id ?? p?.patient_id
                                          const memberIdForPatient = resolveMemberIdForItemAndVisit(it, tcId, p?.name, pi)
                                          const vendorIdVariants = [p?.id, p?.lead_id, p?.patient_id]
                                            .filter(v => v != null && String(v).trim())
                                            .map(v => String(v).trim())
                                          const alternatePatientIds = [...new Set(vendorIdVariants)].filter(x => x !== String(patientId))
                                          return (
                                            <div key={`${itemIdx}-${vi}-p-${patientId ?? pi}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                              <span style={{ ...LABEL, color: '#161616' }}>{String(p?.name ?? `Patient ${pi + 1}`)}</span>
                                              {patientId && (
                                                <button
                                                  className="order-detail-patientViewReportBtn"
                                                  type="button"
                                                  onClick={() =>
                                                    handleViewReport(String(patientId), {
                                                      thyrocareOrderId: tcId,
                                                      leadId: String(
                                                        p?.lead_id ?? p?.patient_id ?? p?.id ?? patientId,
                                                      ),
                                                      memberId: memberIdForPatient,
                                                      alternatePatientIds,
                                                    })}
                                                  disabled={!!reportLoading[String(patientId)]}
                                                >
                                                  {reportLoading[String(patientId)] ? 'Loading…' : (
                                                    <>
                                                      <img className="order-detail-patientViewReportIcon" src={fileIcon} alt="" aria-hidden="true" />
                                                      View report
                                                    </>
                                                  )}
                                                </button>
                                              )}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {!canTrack && (
                      <div className="order-detail-trackingCard" style={{ ...CARD, boxShadow: 'none', padding: '12px 0', background: 'transparent', outline: 'none' }}>
                        {/* Current stage headline removed (timeline below is sufficient) */}
                        <div className="order-detail-trackList">
                          <div className="order-detail-trackLine" aria-hidden="true" />
                          {clientOnlyVisitSteps(order, {
                            statusRaw: it.member_address_map[0]?.order_status ?? order.order_status,
                            scheduledDate: it.member_address_map[0]?.scheduled_date,
                          }).map((step, i) => (
                            <div key={`${itemIdx}-fallback-s-${i}`} className="order-detail-trackRow">
                              <div className="order-detail-trackMarker" data-done={step.done ? 'true' : 'false'} aria-hidden="true">
                                {step.done && <img src={tickIcon} alt="" className="order-detail-trackTick" />}
                              </div>
                              <div className="order-detail-trackText">
                                <div className="order-detail-trackLabel">{step.label}</div>
                                {step.time && <div className="order-detail-trackTime">{step.time}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ height: 1, background: '#F3F4F6' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <span style={{ ...LABEL, color: '#161616', fontWeight: 500, fontSize: 13 }}>Members &amp; addresses</span>
                      {it.member_address_map.map((entry, ri) => {
                        const m = entry.member
                        const addr = entry.address
                        const isDone = entry.order_status?.toUpperCase() === 'COMPLETED'
                        const patientId = resolvePatientIdForRow(entry, it, stripIds)
                        const hasReport = isDone && !!patientId
                        const tcIdForRow = canTrack ? effectiveRowThyrocareId(entry, stripIds) : null
                        const myRowForStatus = tcIdForRow ? myOrderByTcId[tcIdForRow] : undefined
                        const dForStatus = tcIdForRow ? thyrocareById[tcIdForRow] : undefined
                        const histForStatus = resolveHistoryForBooking(myRowForStatus, dForStatus)
                        const visitStepsForRow = tcIdForRow
                          ? buildVisitStepsWithOrderBooked(order, histForStatus, myRowForStatus, dForStatus)
                          : []
                        const hasVendorSignal = !!(myRowForStatus || dForStatus)
                        const rowLoading = tcIdForRow ? !!thyrocareLoading[tcIdForRow] : false
                        const dForAlt = tcIdForRow ? thyrocareById[tcIdForRow] : undefined
                        const vendorPatients: any[] = Array.isArray((dForAlt as any)?.patients)
                          ? (dForAlt as any).patients
                          : []
                        const vendorMatch = vendorPatients.find(
                          (tp: any) => normalizePersonName(tp?.name) === normalizePersonName(m.name),
                        )
                        const alternatePatientIds = vendorMatch
                          ? [...new Set(
                              [vendorMatch.id, vendorMatch.lead_id, vendorMatch.patient_id]
                                .filter(v => v != null && String(v).trim())
                                .map(v => String(v).trim()),
                            )].filter(x => x !== String(patientId))
                          : undefined
                        const rowStatusDisplay =
                          !tcIdForRow || !canTrack
                            ? statusLabel(entry.order_status)
                            : rowLoading && !hasVendorSignal
                              ? 'Loading…'
                              : hasVendorSignal
                                ? timelineHeadlineFromSteps(visitStepsForRow)
                                : statusLabel(entry.order_status)
                        return (
                          <div
                            key={entry.order_item_id ?? ri}
                            style={{
                              border: '1px solid #F3F4F6',
                              borderRadius: 10,
                              padding: 12,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                              <div>
                                <div style={VALUE}>{m.name}</div>
                                <div className="order-detail-memberMeta" style={LABEL}>{m.relation} · {m.age} yrs · {formatMemberGender(m.gender)}</div>
                              </div>
                            </div>
                            <div className="order-detail-addressLine" style={LABEL}>
                              {addr.street_address}, {addr.city}, {addr.state} {addr.postal_code}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {!isDone && (
                                <span className="order-detail-patientOutcomeDot" aria-hidden="true">
                                  <img src={inAnalysisIcon} alt="" style={{ width: 20, height: 20 }} />
                                </span>
                              )}
                              <span style={{ fontSize: 13, color: '#161616' }}>{rowStatusDisplay}</span>
                              {entry.scheduled_date && (
                                <span style={LABEL}>· {formatDate(entry.scheduled_date)}</span>
                              )}
                            </div>
                            {patientId && (isDone || hasReport) && (
                              <button
                                className="order-detail-patientViewReportBtn"
                                type="button"
                                onClick={() =>
                                  handleViewReport(patientId, {
                                    thyrocareOrderId: tcIdForRow ?? undefined,
                                    leadId: patientId,
                                    memberId: entry.member.member_id,
                                    alternatePatientIds,
                                  })}
                                disabled={!!reportLoading[patientId]}
                              >
                                {reportLoading[patientId] ? 'Loading…' : (
                                  <>
                                    <img className="order-detail-patientViewReportIcon" src={fileIcon} alt="" aria-hidden="true" />
                                    View report
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={SECTION_TITLE}>Billing &amp; Payment Summary</span>
            <div className="order-detail-billingCard" style={CARD}>
              <div className="order-detail-billingStrip">
                <div className="order-detail-billingStripInner">
                  {billingStripItems.map(meta => (
                    <div key={meta.label} className="order-detail-billingMeta">
                      <div className="order-detail-billingMetaLabel">{meta.label}</div>
                      <div className="order-detail-billingMetaValue">{meta.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-detail-billingBody">
                <div className="order-detail-billingItems">
                  {order.items.map((line, i) => (
                    <div key={i} className="order-detail-billingItemRow">
                      <div className="order-detail-billingItemName">
                        {line.product_name} x {line.member_ids.length}
                      </div>
                      <div className="order-detail-billingItemAmount">₹{line.total_amount}</div>
                    </div>
                  ))}
                </div>

                <div className="order-detail-billingDivider" aria-hidden="true" />

                <div className="order-detail-billingRow">
                  <div className="order-detail-billingRowLabel">
                    Subtotal({order.items.length} item{order.items.length !== 1 ? 's' : ''})
                  </div>
                  <div className="order-detail-billingRowValue">₹{order.subtotal}</div>
                </div>

                <div className="order-detail-billingRow">
                  <div className="order-detail-billingRowLabel">You Save</div>
                  <div className="order-detail-billingRowValue order-detail-billingRowValue--positive">
                    -₹{order.discount}
                  </div>
                </div>

                <div className="order-detail-billingRow">
                  <div className="order-detail-billingRowLabel">Home Collection</div>
                  <div className="order-detail-billingRowValue order-detail-billingRowValue--positive">FREE</div>
                </div>

                <div className="order-detail-billingDivider" aria-hidden="true" />

                <div className="order-detail-billingTotalRow">
                  <div className="order-detail-billingTotalLabel">Total</div>
                  <div className="order-detail-billingTotalValue">₹{order.total_amount}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

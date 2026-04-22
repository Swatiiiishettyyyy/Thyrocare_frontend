import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Navbar } from '../components'
import EmptyReportPage from './EmptyReportPage'
import {
  fetchMyReports,
  fetchOrders,
  fetchThyrocareMyOrders,
  getMyReportRowKey,
  thyrocareIdsForOrderItem,
  type MyReportRow,
  type Order,
  type ThyrocareMyOrderRow,
} from '../api/orders'
import { fetchMembers, type Member } from '../api/member'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

function str(r: MyReportRow, ...keys: string[]): string {
  for (const k of keys) {
    const v = r[k]
    if (v != null && String(v).trim()) return String(v).trim()
  }
  return ''
}

function initialsFromName(name: string): string {
  const p = name.split(/\s+/).filter(Boolean)
  if (p.length === 0) return '?'
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase()
  return (p[0]![0] + p[1]![0]).toUpperCase()
}

function formatReportDate(raw: string): string {
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

type ListReport = {
  key: string
  initials: string
  name: string
  patient: string
  date: string
  external: boolean
  raw: MyReportRow
}

/** Nucleotide / API name, or family list lookup by `member_id` (not lab `patient_id`). */
function resolveMemberDisplayName(r: MyReportRow, members: Member[]): string {
  const fromApi = str(
    r,
    'patient_name',
    'member_name',
    'patientName',
    'beneficiary_name',
    'member_full_name',
    'full_name',
  )
  if (fromApi) return fromApi
  const midRaw = r.member_id ?? r.memberId
  if (midRaw != null && String(midRaw).trim() !== '') {
    const id = Number(midRaw)
    const m = members.find(x => x.member_id === id)
    if (m?.name?.trim()) {
      const name = m.name.trim()
      const rel = (m.relation ?? '').trim()
      if (rel && !/^self$/i.test(rel)) return `${name} (${rel})`
      return name
    }
  }
  return ''
}

function normalizeThyrocareOrderId(raw: string): string {
  return String(raw ?? '').trim().toUpperCase()
}

function allThyrocareOrderIdsOnReport(r: MyReportRow): Set<string> {
  const s = new Set<string>()
  const top = r.thyrocare_order_id ?? r.thyrocareOrderId
  if (top != null && String(top).trim()) s.add(normalizeThyrocareOrderId(String(top)))
  const results = r.results
  if (Array.isArray(results)) {
    for (const line of results) {
      if (line == null || typeof line !== 'object') continue
      const o = line as Record<string, unknown>
      const tc = o.thyrocare_order_id ?? o.thyrocareOrderId
      if (tc != null && String(tc).trim()) s.add(normalizeThyrocareOrderId(String(tc)))
    }
  }
  return s
}

function thyrocareIdsForOrder(o: Order): Set<string> {
  const s = new Set<string>()
  const top = o.thyrocare_order_id?.trim()
  if (top) s.add(normalizeThyrocareOrderId(top))
  for (const it of o.items ?? []) {
    for (const id of thyrocareIdsForOrderItem(it)) {
      if (id.trim()) s.add(normalizeThyrocareOrderId(id))
    }
  }
  return s
}

/** Maps Thyrocare booking id → Nucleotide `our_order_id` (from GET /thyrocare/orders/my-orders). */
function buildThyrocareToOurOrderIdMap(rows: ThyrocareMyOrderRow[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const row of rows) {
    const tc = normalizeThyrocareOrderId(String(row.thyrocare_order_id ?? ''))
    if (!tc) continue
    const oid = row.our_order_id
    if (oid == null || Number.isNaN(Number(oid))) continue
    m.set(tc, Number(oid))
  }
  return m
}

function isNumericDbOrderId(v: unknown): boolean {
  if (v == null) return false
  const s = String(v).trim()
  if (!s || s.includes('/')) return false
  return /^\d+$/.test(s)
}

/** `order_number` from GET /orders/list — not my-reports `order_no`. Uses my-orders to bridge Thyrocare ids when list rows lack nested lab ids. */
function resolveOrdersListOrderNumber(
  r: MyReportRow,
  orders: Order[],
  thyrocareToOurOrderId: Map<string, number>,
): string {
  const idCandidates: unknown[] = [
    r.our_order_id,
    r.ourOrderId,
    r.nucleotide_order_id,
    r.nucleotideOrderId,
    r.internal_order_id,
  ]
  if (isNumericDbOrderId(r.order_id)) idCandidates.push(r.order_id)
  if (isNumericDbOrderId(r.orderId)) idCandidates.push(r.orderId)

  for (const ourRaw of idCandidates) {
    if (ourRaw == null || !String(ourRaw).trim()) continue
    const key = String(ourRaw).trim()
    const n = Number(key)
    const byId = orders.find(
      o =>
        o.order_id != null &&
        (String(o.order_id) === key || (!Number.isNaN(n) && o.order_id === n)),
    )
    if (byId?.order_number?.trim()) return byId.order_number.trim()
  }

  const tcOnReport = allThyrocareOrderIdsOnReport(r)
  if (tcOnReport.size === 0) return ''

  for (const tc of tcOnReport) {
    const oid = thyrocareToOurOrderId.get(tc)
    if (oid != null) {
      const byId = orders.find(o => o.order_id != null && Number(o.order_id) === Number(oid))
      if (byId?.order_number?.trim()) return byId.order_number.trim()
    }
  }

  for (const o of orders) {
    const orderTcs = thyrocareIdsForOrder(o)
    for (const tc of tcOnReport) {
      if (orderTcs.has(tc)) {
        const num = o.order_number?.trim()
        if (num) return num
      }
    }
  }
  return ''
}

function formatOrderNumberBadge(orderNumber: string): string {
  const t = orderNumber.trim()
  if (!t) return ''
  return t.startsWith('#') ? t : `#${t}`
}

function mapRowToListItem(
  r: MyReportRow,
  index: number,
  members: Member[],
  orders: Order[],
  thyrocareToOurOrderId: Map<string, number>,
): ListReport {
  const patientName = str(r, 'patient_name', 'member_name', 'patientName', 'beneficiary_name')
  const title = str(
    r,
    'test_name',
    'product_name',
    'package_name',
    'report_name',
    'title',
    'order_name',
    'productName',
    'testName',
  )
  const listOrderNumber = resolveOrdersListOrderNumber(r, orders, thyrocareToOurOrderId)
  const orderBadge = listOrderNumber ? formatOrderNumberBadge(listOrderNumber) : ''
  const memberLabel = resolveMemberDisplayName(r, members)
  const name =
    title || patientName || memberLabel || (orderBadge ? `Order ${orderBadge}` : 'Lab report')
  const metaParts = [orderBadge || null, memberLabel || null].filter(Boolean) as string[]
  const patient = metaParts.length ? metaParts.join(' · ') : memberLabel || '—'
  const dateRaw = str(
    r,
    'report_date',
    'sample_date',
    'completed_at',
    'created_at',
    'updated_at',
    'collected_date',
    'reportDate',
  )
  const source = str(r, 'source', 'report_source', 'origin').toLowerCase()
  const external =
    r.external === true ||
    r.is_external === true ||
    source === 'external' ||
    source === 'uploaded' ||
    source === 'user'

  return {
    key: getMyReportRowKey(r, index),
    initials: initialsFromName(memberLabel || patientName || name),
    name,
    patient,
    date: formatReportDate(dateRaw),
    external,
    raw: r,
  }
}

export default function ReportsListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => {
    const t = searchParams.get('tab') || 'All'
    return ['All', 'Nucleotide', 'Uploaded'].includes(t) ? t : 'All'
  })
  const [reports, setReports] = useState<MyReportRow[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [thyrocareMyOrders, setThyrocareMyOrders] = useState<ThyrocareMyOrderRow[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const tabs = ['All', 'Nucleotide', 'Uploaded']

  useEffect(() => {
    let cancelled = false
    void fetchMembers()
      .then(list => {
        if (!cancelled) setMembers(list)
      })
      .catch(() => {
        if (!cancelled) setMembers([])
      })
    return () => { cancelled = true }
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    void fetchOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
    void fetchThyrocareMyOrders()
      .then(setThyrocareMyOrders)
      .catch(() => setThyrocareMyOrders([]))
    fetchMyReports()
      .then(setReports)
      .catch((e: unknown) => {
        const err = e as { status?: number; data?: unknown }
        const st = err?.status
        let detail = ''
        if (err?.data != null && typeof err.data === 'object' && 'detail' in (err.data as object)) {
          detail = String((err.data as { detail?: unknown }).detail ?? '')
        } else if (typeof err?.data === 'string') {
          detail = err.data
        }
        setError(
          st === 401
            ? 'Not authorized to load reports. Your session token may be expired.'
            : st
              ? `Could not load reports (HTTP ${st}).${detail ? ` ${detail}` : ''} Try again.`
              : 'Could not load reports. Check your connection and try again.',
        )
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const thyrocareToOurOrderId = useMemo(
    () => buildThyrocareToOurOrderIdMap(thyrocareMyOrders),
    [thyrocareMyOrders],
  )

  const mapped = useMemo(
    () =>
      reports.map((r, i) =>
        mapRowToListItem(r, i, members, orders, thyrocareToOurOrderId),
      ),
    [reports, members, orders, thyrocareToOurOrderId],
  )

  const filtered = useMemo(() => {
    if (activeTab === 'All') return mapped
    if (activeTab === 'Nucleotide') {
      return mapped.filter(x => !x.external)
    }
    if (activeTab === 'Uploaded') {
      return mapped.filter(x => x.external)
    }
    return mapped
  }, [mapped, activeTab])

  function handleOpenReport(row: ListReport) {
    navigate(`/report?id=${encodeURIComponent(row.key)}`, { state: { report: row.raw } })
  }

  if (!loading && !error && reports.length === 0) {
    return <EmptyReportPage />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Poppins', sans-serif" }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" hideSearchOnMobile onCtaClick={() => navigate('/cart')} />

      <div
        className="cart-breadcrumb"
        style={{
          padding: '14px clamp(16px, 5vw, 56px)',
          borderBottom: '1px solid #F3F4F6',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 14, color: '#6B7280', cursor: 'pointer' }} onClick={() => navigate('/')}>Tests</span>
        <span style={{ fontSize: 14, color: '#6B7280' }}>›</span>
        <span style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>Reports</span>
      </div>

      <div className="reports-list-inner">
        <div className="reports-header-row">
          <div>
            <h1 className="reports-page-title">My Reports</h1>
            <p style={{ fontSize: 15, color: '#9CA3AF', margin: 0 }}>View, track, and understand your health data</p>
          </div>
        </div>

        {error && (
          <div style={{ padding: '16px clamp(16px, 5vw, 56px)', color: '#B91C1C', fontSize: 14 }}>
            {error}{' '}
            <button type="button" onClick={load} style={{ color: '#7C5CFC', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Retry
            </button>
          </div>
        )}

        <div className="reports-toolbar">
          <div className="reports-tabs-scroller">
            <div className="reports-tab-group" role="tablist" aria-label="Report type">
              {tabs.map(t => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === t}
                  onClick={() => setActiveTab(t)}
                  className={`reports-tab-btn${activeTab === t ? ' reports-tab-btn--active' : ''}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="reports-filter-group">
            <button type="button" className="reports-filter-btn">
              Filter
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button type="button" className="reports-filter-btn">
              Sorting
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px clamp(16px, 5vw, 56px)', color: '#9CA3AF', fontSize: 15 }}>Loading reports…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px clamp(16px, 5vw, 56px)', color: '#6B7280', fontSize: 15 }}>
            No reports in this tab.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(r => (
              <div
                key={r.key}
                role="button"
                tabIndex={0}
                onClick={() => void handleOpenReport(r)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    void handleOpenReport(r)
                  }
                }}
                style={{
                  background: '#fff',
                  border: '1px solid #F0F0F0',
                  borderRadius: 16,
                  padding: '20px 28px ',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0px 4px 27.3px 0px rgba(0,0,0,0.05)',
                  transition: 'box-shadow 0.15s ease',
                }}
              >
                {r.external && (
                  <span style={{ position: 'absolute', top: 0, right: 0, background: '#EDE9FE', color: '#7C5CFC', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: '0 14px 0 8px' }}>External Reports</span>
                )}

                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: '#7C5CFC', flexShrink: 0, marginRight: 20 }}>
                  {r.initials}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{r.name}</div>
                  <div style={{ fontSize: 13, color: '#9CA3AF' }}>{r.patient}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', marginRight: 40, minWidth: 100 }}>
                  <span style={{ fontSize: 13, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="13" rx="2" stroke="#9CA3AF" strokeWidth="1.2"/><path d="M5 1v2M11 1v2M1 6h14" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    {r.date}
                  </span>
                </div>

                <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden="true">
                  <path d="M1 1l6 6-6 6" stroke="#C4C4C4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

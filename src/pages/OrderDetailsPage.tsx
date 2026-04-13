/**
 * Primary payload: `order` from router state (GET /orders/list shape), not refetched.
 * Enrichment: GET /thyrocare/orders/:thyrocare_order_id/order-details when id is present.
 * Fixed copy: section titles, fallback tracking step names when no status_history, billing row labels, Home Collection FREE line.
 */
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Navbar } from '../components'
import { fetchOrderByThyrocareId, downloadPatientReport, getEarliestScheduledDate } from '../api/orders'
import type { Order, ThyrocareOrderDetails } from '../api/orders'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '#' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

const CARD: React.CSSProperties = {
  background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
  borderRadius: 16, outline: '1px solid #E7E1FF', outlineOffset: -1,
  padding: '20px 24px', boxSizing: 'border-box', width: '100%',
}
const LABEL: React.CSSProperties = { fontSize: 'clamp(11px, 0.9vw, 14px)', color: '#828282', fontWeight: 400 }
const VALUE: React.CSSProperties = { fontSize: 'clamp(12px, 1vw, 16px)', color: '#161616', fontWeight: 500 }
const SECTION_TITLE: React.CSSProperties = { fontSize: 'clamp(13px, 1.1vw, 18px)', fontWeight: 500, color: '#161616', marginBottom: 8 }

function statusLabel(s: string) {
  switch (s?.toUpperCase()) {
    case 'CONFIRMED': return 'In Progress'
    case 'COMPLETED': return 'Completed'
    case 'CANCELLED': return 'Cancelled'
    default: return s ?? '—'
  }
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

/** Map API status_history row to done flag when the payload includes booleans; otherwise preserve legacy all-complete behavior. */
function statusHistoryStepDone(s: Record<string, unknown>): boolean {
  if (typeof s.completed === 'boolean') return s.completed
  if (typeof s.done === 'boolean') return s.done
  if (typeof s.is_completed === 'boolean') return s.is_completed
  if (typeof s.is_current === 'boolean') return !s.is_current
  return true
}

function mapStatusHistoryToSteps(
  history: any[],
): Array<{ label: string; time: string; done: boolean }> {
  return history.map((s: any) => ({
    label: String(s.status ?? s.label ?? s.description ?? ''),
    time: s.timestamp
      ? formatDateTime(s.timestamp)
      : s.time
        ? formatDateTime(s.time)
        : '',
    done: statusHistoryStepDone(s as Record<string, unknown>),
  }))
}

export default function OrderDetailsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialOrder = (location.state as { order?: Order })?.order
  const [order, setOrder] = useState<Order | null>(initialOrder ?? null)
  const [thyrocareDetails, setThyrocareDetails] = useState<ThyrocareOrderDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [reportLoading, setReportLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!initialOrder?.thyrocare_order_id) return
    setLoading(true)
    fetchOrderByThyrocareId(initialOrder.thyrocare_order_id)
      .then(details => {
        console.log('[Thyrocare order-details]', details)
        setThyrocareDetails(details)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [initialOrder?.thyrocare_order_id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleViewReport(patientId: string) {
    setReportLoading(prev => ({ ...prev, [patientId]: true }))
    try {
      const res = await downloadPatientReport(patientId)
      const url = res?.url ?? (res as any)?.report_url ?? (res as any)?.download_url
      if (url) window.open(url, '_blank')
      else alert('Report not available yet.')
    } catch {
      alert('Could not fetch report. Please try again.')
    } finally {
      setReportLoading(prev => ({ ...prev, [patientId]: false }))
    }
  }

  if (!order) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif' }}>
        <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" hideSearchOnMobile onCtaClick={() => navigate('/cart')} />

        {/* Breadcrumb */}
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
          <span style={{ fontSize: 14, color: '#6B7280', cursor: 'pointer' }} onClick={() => navigate('/orders')}>Orders</span>
          <span style={{ fontSize: 14, color: '#6B7280' }}>›</span>
          <span style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>Order Details</span>
        </div>
        <div style={{ padding: 40, textAlign: 'center', color: '#828282' }}>
          {loading ? 'Loading order...' : 'Order not found.'}{' '}
          {!loading && <button onClick={() => navigate('/orders')} style={{ color: '#8B5CF6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Back to Orders</button>}
        </div>
      </div>
    )
  }

  const isConfirmed = order.order_status?.toUpperCase() === 'CONFIRMED'
  const isCompleted = order.order_status?.toUpperCase() === 'COMPLETED'

  // Collect all unique members across all items
  const allMemberMaps = order.items.flatMap(it => it.member_address_map)

  // appointment_date may be top-level or inside patients[0]
  const appointmentDate = thyrocareDetails?.appointment_date
    || (thyrocareDetails?.patients?.[0] as any)?.appointment_date
    || getEarliestScheduledDate(order)
  const phlebo = thyrocareDetails?.phlebo
  const hasPhlebo = !!(phlebo?.name?.trim() || phlebo?.contact?.trim())
  const firstAddress = allMemberMaps[0]?.address
  const firstMember = allMemberMaps[0]?.member

  const headerStatusText = thyrocareDetails
    ? (thyrocareDetails.current_status?.trim()
        || thyrocareDetails.current_status_raw
        || statusLabel(order.order_status))
    : statusLabel(order.order_status)

  const appointmentStatusText = thyrocareDetails
    ? (thyrocareDetails.current_status?.trim()
        || thyrocareDetails.current_status_raw
        || (isConfirmed ? 'Scheduled' : isCompleted ? 'Completed' : '—'))
    : (isConfirmed ? 'Scheduled' : isCompleted ? 'Completed' : '—')

  const tcPay = thyrocareDetails?.payment
  const billingStripItems = [
    {
      label: 'Payment Mode',
      value: tcPay?.payment_method ?? order.payment_method_details ?? order.payment_method ?? '—',
    },
    {
      label: 'Transaction Date',
      value: tcPay?.payment_date ? formatDateTime(tcPay.payment_date) : formatDateTime(order.order_date),
    },
    { label: 'Order Number', value: order.order_number },
    {
      label: 'Payment Status',
      value: tcPay?.payment_status ?? order.payment_status,
    },
  ]

  // Tracking: use thyrocare status_history if available, else derive from order_status
  const trackingSteps = thyrocareDetails?.status_history?.length
    ? mapStatusHistoryToSteps(thyrocareDetails.status_history)
    : [
        { label: 'Order Placed',      time: formatDateTime(order.order_date), done: true },
        { label: 'Sample Collection', time: appointmentDate ? formatDate(appointmentDate) : '', done: !!appointmentDate },
        { label: 'Lab Received',      time: '', done: isCompleted },
        { label: 'Processing',        time: '', done: isCompleted },
        { label: 'Report Ready',      time: '', done: isCompleted },
      ]

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif', overflowX: 'hidden' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" hideSearchOnMobile onCtaClick={() => navigate('/cart')} />

      {/* Breadcrumb */}
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
        <span style={{ fontSize: 14, color: '#6B7280', cursor: 'pointer' }} onClick={() => navigate('/orders')}>Orders</span>
        <span style={{ fontSize: 14, color: '#6B7280' }}>›</span>
        <span style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>Order Details</span>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 40px', boxSizing: 'border-box', width: '100%' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Order header banner */}
          <div style={{
            background: 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
            borderRadius: 16, padding: '18px 24px',
            display: 'flex', flexWrap: 'wrap', alignItems: 'center',
            justifyContent: 'space-between', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: 'rgba(139,92,246,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="20" height="22" viewBox="0 0 21 23" fill="none">
                  <path d="M17.5 1H3.5C2.4 1 1.5 1.9 1.5 3V21L5.5 18L10.5 21L15.5 18L19.5 21V3C19.5 1.9 18.6 1 17.5 1Z" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.5 8h8M6.5 12h5" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'clamp(13px, 1.1vw, 18px)', fontWeight: 500, color: '#fff' }}>
                    Order #{order.order_number}
                  </span>
                  <span style={{ padding: '2px 10px', background: '#8B5CF6', borderRadius: 20, fontSize: 'clamp(10px, 0.8vw, 13px)', color: '#F9F9F9' }}>
                    {headerStatusText}
                  </span>
                </div>
                <span style={{ fontSize: 'clamp(11px, 0.9vw, 14px)', color: '#828282' }}>
                  {order.items.map(it => it.product_name).join(' · ')}
                </span>
              </div>
            </div>
            {firstMember && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M14 10.5c-1 0-2-.2-2.9-.5a1 1 0 0 0-1 .2l-1.8 1.8A11 11 0 0 1 4.1 7.7l1.8-1.8a1 1 0 0 0 .2-1C5.8 4 5.5 3 5.5 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1c0 7.2 5.8 13 13 13a1 1 0 0 0 1-1v-2.5a1 1 0 0 0-1-1z" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontSize: 'clamp(11px, 0.9vw, 14px)', color: '#F9F9F9' }}>{firstMember.mobile}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="6" r="3" stroke="#8B5CF6" strokeWidth="1.5"/>
                    <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontSize: 'clamp(11px, 0.9vw, 14px)', color: '#F9F9F9' }}>
                    {allMemberMaps.map(m => m.member.name).join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Appointment + Collection Address */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={SECTION_TITLE}>Appointment</span>
              <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E7E1FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>📅</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={VALUE}>{formatDate(appointmentDate || order.order_date)}</span>
                  <span style={LABEL}>{appointmentStatusText}</span>
                </div>
              </div>
            </div>
            <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={SECTION_TITLE}>Collection Address</span>
              <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E7E1FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>📍</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={VALUE}>{firstAddress?.address_label ?? 'Home Collection'}</span>
                  {firstAddress && (
                    <span style={LABEL}>
                      {firstAddress.street_address}, {firstAddress.city}, {firstAddress.state} - {firstAddress.postal_code}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {hasPhlebo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={SECTION_TITLE}>Phlebotomist</span>
              <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {phlebo?.name?.trim() && (
                  <span style={VALUE}>{phlebo.name.trim()}</span>
                )}
                {phlebo?.contact?.trim() && (
                  <span style={{ ...LABEL, fontSize: 'clamp(12px, 1vw, 15px)' }}>{phlebo.contact.trim()}</span>
                )}
              </div>
            </div>
          )}

          {/* Order Tracking */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={SECTION_TITLE}>Order Tracking</span>
            <div style={CARD}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {trackingSteps.map((step, i) => (
                  <div key={`${i}-${step.label || 'step'}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: step.done ? '#8B5CF6' : '#E7E1FF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {step.done && (
                          <svg width="10" height="8" viewBox="0 0 14 11" fill="none">
                            <path d="M1 5l4 4L13 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      {i < trackingSteps.length - 1 && <div style={{ width: 1, height: 28, background: '#E7E1FF' }} />}
                    </div>
                    <div style={{ paddingTop: 1, paddingBottom: i < trackingSteps.length - 1 ? 8 : 0 }}>
                      <span style={{ ...VALUE, display: 'block' }}>{step.label}</span>
                      {step.time && <span style={{ ...LABEL, display: 'block' }}>{step.time}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Patient Record */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={SECTION_TITLE}>Patient Record</span>
            <div style={CARD}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {allMemberMaps.map((entry, i) => {
                  const m = entry.member
                  const itemForMember = order.items.find(it => it.member_ids.includes(m.member_id))
                  const isDone = entry.order_status?.toUpperCase() === 'COMPLETED'
                  // Match thyrocare patient by name (case-insensitive) to get lead_id
                  const thyrocarePatient = thyrocareDetails?.patients?.find(
                    (p: any) => p.name?.toLowerCase() === m.name?.toLowerCase()
                  ) ?? thyrocareDetails?.patients?.[i]
                  const patientId: string | undefined = thyrocarePatient?.id ?? thyrocarePatient?.lead_id ?? thyrocarePatient?.patient_id
                  const hasReport = isDone && !!patientId
                  return (
                    <div key={entry.order_item_id ?? i}>
                      {i > 0 && <div style={{ height: 1, background: '#E7E1FF', margin: '20px 0' }} />}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 52, height: 52, borderRadius: 12, background: '#E7E1FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="8" r="4" stroke="#8B5CF6" strokeWidth="1.8"/>
                              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 15, fontWeight: 500, color: '#161616' }}>{m.name}</span>
                            <span style={{ fontSize: 13, color: '#828282' }}>
                              {m.age} Yrs · {formatMemberGender(m.gender)} · {m.relation}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: '#161616' }}>Report Outcome</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: isDone ? '#41C9B3' : '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isDone
                                ? <svg width="10" height="8" viewBox="0 0 12 10" fill="none"><path d="M1 5l3 3L11 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                : <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="3" fill="#fff"/></svg>
                              }
                            </div>
                            <span style={{ fontSize: 14, color: '#828282' }}>{isDone ? 'Complete' : 'In Analysis'}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ fontSize: 13, color: '#828282' }}>Assigned Test</span>
                          <span style={{
                            padding: '6px 16px', background: '#FFF4EF',
                            borderRadius: 100, outline: '1px solid #EA8C5A', outlineOffset: -1,
                            fontSize: 13, color: '#161616', fontFamily: 'Inter, sans-serif', display: 'inline-block',
                          }}>{itemForMember?.product_name ?? '—'}</span>
                        </div>
                        {(isDone || hasReport) && patientId && (
                          <button
                            onClick={() => handleViewReport(patientId)}
                            disabled={!!reportLoading[patientId]}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '10px 24px', background: '#8B5CF6', borderRadius: 8, border: 'none',
                              color: '#fff', fontSize: 14, fontWeight: 500,
                              cursor: reportLoading[patientId] ? 'wait' : 'pointer',
                              whiteSpace: 'nowrap', flexShrink: 0,
                              opacity: reportLoading[patientId] ? 0.7 : 1,
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                            {reportLoading[patientId] ? 'Loading...' : 'View Report'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Billing & Payment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={SECTION_TITLE}>Billing &amp; Payment Summary</span>
            <div style={CARD}>
              <div style={{
                background: 'linear-gradient(180deg, #E7E1FF 0%, #fff 100%)',
                borderRadius: 10, padding: '16px 20px', marginBottom: 20,
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16,
              }}>
                {billingStripItems.map(m => (
                  <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#161616' }}>{m.label}</span>
                    <span style={{ fontSize: 13, color: '#828282' }}>{m.value}</span>
                  </div>
                ))}
              </div>

              {/* Items */}
              <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {order.items.map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#161616' }}>{it.product_name} × {it.member_ids.length}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#161616' }}>₹{it.total_amount}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ height: 1, background: '#E7E1FF' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#161616' }}>Subtotal</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#161616' }}>₹{order.subtotal}</span>
                </div>
                {order.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#161616' }}>Discount</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#41C9B3' }}>-₹{order.discount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#161616' }}>Home Collection</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#41C9B3' }}>FREE</span>
                </div>
                <div style={{ height: 1, background: '#E7E1FF' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#161616' }}>Total</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#101129' }}>₹{order.total_amount}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

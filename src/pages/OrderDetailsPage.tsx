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
import backArrow from '../assets/figma/order-details/arrow.svg'
import calendarIcon from '../assets/figma/order-details/Frame-2.svg'
import locationIcon from '../assets/figma/order-details/Frame 29364.svg'
import orderCubeIcon from '../assets/figma/order-details/Frame-3.svg'
import emailIcon from '../assets/figma/order-details/Frame 29427.svg'
import phoneIcon from '../assets/figma/order-details/call.svg'
import tickIcon from '../assets/figma/order-details/icon.svg'
import fileIcon from '../assets/figma/order-details/file.svg'
import inAnalysisIcon from '../assets/figma/order-details/Frame (1).svg'

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
  const orderEmail = (thyrocareDetails as any)?.email ?? (thyrocareDetails as any)?.customer_email ?? '—'
  const orderPhone = (thyrocareDetails as any)?.mobile ?? (thyrocareDetails as any)?.customer_mobile ?? firstMember?.mobile ?? '—'

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
    { label: 'Security', value: 'AES-256 Encrypted' },
    {
      label: 'Invoice No',
      value: `NUC-INV-${String(order.order_number ?? '').slice(-4).padStart(4, '0')}`,
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
    <div className="order-detail-page" style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif', overflowX: 'hidden' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" hideSearchOnMobile onCtaClick={() => navigate('/cart')} />

      <div
        className="order-detail-inner"
        style={{}}
      >
        <div className="order-detail-bg" aria-hidden="true">
          <div className="order-detail-blob order-detail-blob--green" />
          <div className="order-detail-blob order-detail-blob--purple" />
        </div>

        {/* Back */}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 3vmin, 28px)', marginTop: 'clamp(14px, 2.2vmin, 20px)' }}>

          {/* Order header banner */}
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
                    {headerStatusText}
                  </span>
                </div>
                <span className="order-detail-heroSub" style={{ fontSize: 'var(--type-body)', color: 'rgba(255,255,255,0.62)', lineHeight: 'var(--lh-body)' }}>
                  Home Collection
                </span>
              </div>
            </div>
            {firstMember && (
              <div className="order-detail-heroContacts" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.4vmin, 10px)' }}>
                <div className="order-detail-heroContactRow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img className="order-detail-heroContactIcon" src={emailIcon} alt="" style={{ width: 'clamp(14px, 1.8vmin, 16px)', height: 'clamp(14px, 1.8vmin, 16px)', display: 'block' }} />
                  <span className="order-detail-heroContactText" style={{ fontSize: 'var(--type-body)', color: '#F9F9F9', lineHeight: 'var(--lh-body)' }}>{orderEmail}</span>
                </div>
                <div className="order-detail-heroContactRow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img className="order-detail-heroContactIcon" src={phoneIcon} alt="" style={{ width: 'clamp(14px, 1.8vmin, 16px)', height: 'clamp(14px, 1.8vmin, 16px)', display: 'block' }} />
                  <span className="order-detail-heroContactText" style={{ fontSize: 'var(--type-body)', color: '#F9F9F9', lineHeight: 'var(--lh-body)' }}>{orderPhone}</span>
                </div>
              </div>
            )}
          </div>

          {/* Appointment + Collection Address */}
          <div className="order-detail-twoUp" style={{ gap: 'clamp(14px, 2.2vmin, 16px)' }}>
            <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.2vmin, 10px)' }}>
              <span style={SECTION_TITLE}>Appointment</span>
              <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vmin, 14px)' }}>
                <div style={{ width: 'clamp(44px, 5.8vmin, 52px)', height: 'clamp(44px, 5.8vmin, 52px)', borderRadius: 999, background: '#E7E1FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src={calendarIcon} alt="" style={{ width: 24, height: 24, display: 'block' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={VALUE}>{formatDate(appointmentDate || order.order_date)}</span>
                  <span style={LABEL}>{appointmentDate ? '7.00 AM - 8.00 AM' : appointmentStatusText}</span>
                </div>
              </div>
            </div>
            <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.2vmin, 10px)' }}>
              <span style={SECTION_TITLE}>Collection Address</span>
              <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vmin, 14px)' }}>
                <div style={{ width: 'clamp(44px, 5.8vmin, 52px)', height: 'clamp(44px, 5.8vmin, 52px)', borderRadius: 999, background: '#E7E1FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src={locationIcon} alt="" style={{ width: 24, height: 24, display: 'block' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={VALUE}>{firstAddress?.address_label ?? formatDate(appointmentDate || order.order_date)}</span>
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
            <div className="order-detail-trackingCard" style={CARD}>
              <div className="order-detail-trackList">
                <div className="order-detail-trackLine" aria-hidden="true" />
                {trackingSteps.map((step, i) => (
                  <div key={`${i}-${step.label || 'step'}`} className="order-detail-trackRow">
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
          </div>

          {/* Patient Record */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={SECTION_TITLE}>Patient Record</span>
            <div className="order-detail-patientCard" style={CARD}>
              <div className="order-detail-patientList">
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
                    <div key={entry.order_item_id ?? i} className="order-detail-patientEntry">
                      {i > 0 && <div className="order-detail-patientDivider" aria-hidden="true" />}

                      <div className="order-detail-patientTop">
                        <div className="order-detail-patientAvatar" aria-hidden="true">
                          <img src={calendarIcon} alt="" />
                        </div>
                        <div className="order-detail-patientMeta">
                          <div className="order-detail-patientName">{m.name}</div>
                          <div className="order-detail-patientSub">
                            {m.age} Yrs • {formatMemberGender(m.gender)} • UID: P-{String(i + 101).padStart(3, '0')}
                          </div>
                        </div>
                      </div>

                      <div className="order-detail-patientOutcome">
                        <div className="order-detail-patientSectionTitle">Report Outcome</div>
                        <div className="order-detail-patientOutcomeRow">
                          {!isDone && (
                            <span className="order-detail-patientOutcomeDot" aria-hidden="true">
                              <img src={inAnalysisIcon} alt="" />
                            </span>
                          )}
                          <span className="order-detail-patientOutcomeText">{isDone ? 'Completed' : 'In Analysis'}</span>
                        </div>
                      </div>

                      <div className="order-detail-patientBiomarker">
                        <div className="order-detail-patientBiomarkerLabel">Assigned Biomarker</div>
                        <div className="order-detail-patientBiomarkerPill">
                          {itemForMember?.product_name ?? '—'}
                        </div>
                      </div>

                      {patientId && (isDone || hasReport) && (
                        <button
                          className="order-detail-patientViewReportBtn"
                          onClick={() => handleViewReport(patientId)}
                          disabled={!!reportLoading[patientId]}
                          type="button"
                        >
                          {reportLoading[patientId] ? (
                            'Loading...'
                          ) : (
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
          </div>

          {/* Billing & Payment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={SECTION_TITLE}>Billing &amp; Payment Summary</span>
            <div className="order-detail-billingCard" style={CARD}>
              <div className="order-detail-billingStrip">
                <div className="order-detail-billingStripInner">
                  {billingStripItems.map(m => (
                    <div key={m.label} className="order-detail-billingMeta">
                      <div className="order-detail-billingMetaLabel">{m.label}</div>
                      <div className="order-detail-billingMetaValue">{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-detail-billingBody">
                <div className="order-detail-billingItems">
                  {order.items.map((it, i) => (
                    <div key={i} className="order-detail-billingItemRow">
                      <div className="order-detail-billingItemName">
                        {it.product_name} x {it.member_ids.length}
                      </div>
                      <div className="order-detail-billingItemAmount">₹{it.total_amount}</div>
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

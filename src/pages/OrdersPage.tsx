/**
 * Row data: GET /orders/list only (no per-row Thyrocare order-details).
 * Fixed copy: page title, tabs, loading/empty strings, status label+colors, column labels (Appointment / Ordered / Total).
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'
import { fetchOrders, getEarliestScheduledDate } from '../api/orders'
import type { Order } from '../api/orders'
import { useAuth } from '../context/AuthContext'
import noOrdersIllustration from '../assets/figma/No_orders/fi_17569011.svg'
import orderIconGreen from '../assets/figma/order-listing/Frame.svg'
import orderIconPurple from '../assets/figma/order-listing/Frame-2.svg'
import chevronRight from '../assets/figma/order-listing/Frame-1.svg'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '#' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

function statusStyle(status: string): { color: string; bg: string; border: string } {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED': return { color: '#8B5CF6', bg: '#E7E1FF', border: '#E7E1FF' }
    case 'COMPLETED': return { color: '#41C9B3', bg: '#E6F6F3', border: '#41C9B3' }
    case 'CANCELLED': return { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' }
    default:          return { color: '#828282', bg: '#F3F4F6', border: '#E5E7EB' }
  }
}

function statusLabel(status: string): string {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED': return 'In Progress'
    case 'COMPLETED': return 'Complete'
    case 'CANCELLED': return 'Cancelled'
    default: return status ?? 'Unknown'
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const { currentMember } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const tabs = ['All', 'Active', 'Completed']

  // Rows use GET /orders/list only; Thyrocare order-details are not fetched per row (avoids N+1).
  // Re-fetch whenever the selected member changes so the list always reflects the active profile.
  useEffect(() => {
    setLoading(true)
    fetchOrders(currentMember?.member_id)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [currentMember?.member_id])

  const filtered = orders.filter(o => {
    if (activeTab === 'All') return true
    if (activeTab === 'Active') return o.order_status?.toUpperCase() === 'CONFIRMED'
    if (activeTab === 'Completed') return o.order_status?.toUpperCase() === 'COMPLETED'
    return true
  })

  return (
    <div
      style={{
        minHeight: '100vh',
        fontFamily: 'Poppins, sans-serif',
        overflowX: 'hidden',
        background: '#fff',
        position: 'relative',
      }}
    >
      {/* Full-screen blobs background (not a tint/gradient image) */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 'clamp(-420px, -28vw, -260px)',
            top: 'clamp(80px, 18vh, 220px)',
            width: 'clamp(520px, 60vw, 980px)',
            height: 'clamp(420px, 50vw, 860px)',
            background: '#41C9B3',
            opacity: 0.22,
            filter: 'blur(clamp(120px, 16vw, 220px))',
            borderRadius: 9999,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 'clamp(-460px, -30vw, -280px)',
            top: 'clamp(-40px, 6vh, 140px)',
            width: 'clamp(560px, 64vw, 1040px)',
            height: 'clamp(460px, 54vw, 920px)',
            background: '#8B5CF6',
            opacity: 0.22,
            filter: 'blur(clamp(120px, 16vw, 220px))',
            borderRadius: 9999,
          }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
      <Navbar
        logoSrc="/favicon.svg"
        logoAlt="Nucleotide"
        links={NAV_LINKS}
        ctaLabel="My Cart"
        hideSearchOnMobile
        onCtaClick={() => navigate('/cart')}
      />

      <div
        className="orders-inner"
        style={{
          width: '100%',
          maxWidth: 'var(--page-inner-w)',
          margin: '0 auto',
          padding: 'calc(var(--pad-section-y) * 0.55) var(--pad-section-x) calc(var(--pad-section-y) * 0.7)',
          boxSizing: 'border-box',
          position: 'relative',
          background: 'transparent',
        }}
      >
        {/* Header */}
        <div className="orders-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'clamp(12px, 1.8vmin, 18px)', marginBottom: 'clamp(18px, 3vmin, 28px)', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1.2vmin, 10px)', maxWidth: 'min(520px, 100%)' }}>
            <span className="orders-title" style={{ fontWeight: 500, color: '#161616', letterSpacing: '-0.02em', lineHeight: 'var(--lh-snug)' }}>
              Order Management
            </span>
            <span className="orders-subtitle" style={{ fontSize: 'var(--type-lead)', color: '#828282', lineHeight: 'var(--lh-body)' }}>
              Track and manage your diagnostic appointments.
            </span>
          </div>

          <div className="orders-tabs" style={{ display: 'flex', background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)', borderRadius: 999, outline: '1px solid #E7E1FF', outlineOffset: -1, padding: 'clamp(10px, 1.8vmin, 14px)', gap: 'clamp(8px, 1.4vmin, 10px)' }}>
            {tabs.map(t => {
              const isActive = activeTab === t
              return (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={[
                    'orders-tabBtn',
                    t === 'All' ? 'orders-tabBtn--all' : t === 'Active' ? 'orders-tabBtn--active' : 'orders-tabBtn--completed',
                    isActive ? 'is-active' : '',
                  ].filter(Boolean).join(' ')}
                  style={{
                  padding: 'clamp(8px, 1.3vmin, 10px) clamp(16px, 2.1vmin, 28px)',
                  borderRadius: 999,
                  border: 'none',
                  background: '#fff',
                  boxShadow: isActive ? '0px 4px 27.3px rgba(0,0,0,0.05)' : 'none',
                  outline: isActive ? '1px solid #E7E1FF' : 'none',
                  outlineOffset: -1,
                  color: isActive ? '#8B5CF6' : '#161616',
                  fontSize: 'var(--type-ui)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: 'Poppins, sans-serif',
                  lineHeight: 'var(--lh-ui)',
                }}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <p style={{ color: '#828282', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>Loading orders...</p>
        ) : filtered.length === 0 ? (
          <div
            className="orders-empty"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(18px, 3vmin, 28px)',
              padding: 'clamp(28px, 5vmin, 44px) 0',
              minHeight: 'min(520px, calc(100vh - 240px))',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* Illustration */}
            <div style={{
              width: 'clamp(160px, 22vw, 300px)',
              aspectRatio: '1',
              background: 'linear-gradient(180deg, #E7E1FF 0%, #fff 100%)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src={noOrdersIllustration} alt="No orders" style={{ width: '34%', height: 'auto' }} />
            </div>
            {/* Text */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, maxWidth: 470, textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--type-subhead)', fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: 1.15, letterSpacing: '-0.03em' }}>
                No Orders Yet
              </h2>
              <p
                className="orders-empty-subtitle"
                style={{
                  margin: '0 auto',
                  fontSize: 'var(--type-body)',
                  color: '#414141',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 400,
                  lineHeight: 'var(--lh-body)',
                  maxWidth: 'min(72ch, 100%)',
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                You haven't booked any tests or packages. Your orders will appear here once you make a booking.
              </p>
            </div>
            {/* CTA */}
            <button
              onClick={() => navigate('/packages')}
              className="orders-empty-cta"
              style={{
                width: '100%',
                maxWidth: 470,
                minHeight: 'clamp(52px, 6vmin, 58px)',
                background: '#8B5CF6', border: 'none', borderRadius: 10,
                color: '#fff', fontSize: 'var(--type-ui)', fontWeight: 500,
                fontFamily: 'Poppins, sans-serif', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              Explore Packages
              <img src={chevronRight} alt="" style={{ width: 'clamp(16px, 2vmin, 18px)', height: 'clamp(16px, 2vmin, 18px)', display: 'block', filter: 'brightness(0) invert(1)' }} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 1.8vmin, 16px)', position: 'relative', zIndex: 1 }}>
            {filtered.map((order, i) => {
              const st = statusStyle(order.order_status)
              const allMembers = order.items.flatMap(item =>
                item.member_address_map.map(m => m.member.name)
              )
              const uniqueMembers = [...new Set(allMembers)]
              const productNames = order.items.map(it => it.product_name).join(', ')
              const scheduledDate = getEarliestScheduledDate(order)

              return (
                <div
                  key={i}
                  className="orders-card"
                  onClick={() => navigate('/order-details', {
                    state: {
                      order,
                      orderNumber: String(order.order_number ?? '').trim(),
                    },
                  })}
                  style={{
                    background: '#fff',
                    boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
                    borderRadius: 'clamp(16px, 2.4vmin, 20px)',
                    outline: '1px solid #E7E1FF',
                    outlineOffset: -1,
                    padding: 'clamp(18px, 4.6vw, 22px) clamp(18px, 6.8vw, 28px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'clamp(14px, 4vw, 20px)',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    width: '100%',
                  }}
                >
                  <div
                    className="orders-card-icon"
                    style={{
                      width: 'clamp(34px, 10.5vw, 40px)',
                      height: 'clamp(34px, 10.5vw, 40px)',
                      borderRadius: 999,
                      background: st.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={order.order_status?.toUpperCase() === 'COMPLETED' ? orderIconGreen : orderIconPurple}
                      alt=""
                      style={{
                        width: 'clamp(18px, 5.6vw, 24px)',
                        height: 'clamp(18px, 5.6vw, 24px)',
                        display: 'block',
                      }}
                    />
                  </div>

                  <div className="orders-card-top" style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                    <div className="orders-card-topRow" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 4.2vw, 17px)', flexWrap: 'wrap' }}>
                      <div
                        className="orders-card-orderNo"
                        style={{
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: 500,
                          fontSize: 'clamp(15px, 4.8vw, 18px)',
                          color: '#161616',
                          letterSpacing: '-0.02em',
                          lineHeight: '20px',
                        }}
                      >
                        #{order.order_number}
                      </div>
                      <div
                        className="orders-card-status"
                        style={{
                          height: 'clamp(24px, 7.8vw, 28px)',
                          padding: 'clamp(2px, 0.9vw, 3px) clamp(8px, 2.6vw, 10px)',
                          background: st.bg,
                          borderRadius: 32,
                          border: `0.8px solid ${st.border}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxSizing: 'border-box',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 400,
                            fontSize: 'clamp(12px, 3.6vw, 13px)',
                            color: st.color,
                            whiteSpace: 'nowrap',
                            lineHeight: '20px',
                          }}
                        >
                          {statusLabel(order.order_status)}
                        </span>
                      </div>
                    </div>

                    <div className="orders-card-subRow" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'nowrap' }}>
                      <span
                        style={{
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: 400,
                          fontSize: 'clamp(12px, 3.6vw, 13px)',
                          color: '#828282',
                          lineHeight: '20px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {uniqueMembers.join(', ')}
                      </span>
                      <div style={{ width: 1, height: 'clamp(14px, 4.4vw, 20px)', background: '#E7E1FF', flexShrink: 0 }} />
                      <span
                        style={{
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: 400,
                          fontSize: 'clamp(12px, 3.6vw, 13px)',
                          color: '#101129',
                          lineHeight: '20px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minWidth: 0,
                        }}
                      >
                        {productNames}
                      </span>
                    </div>
                  </div>

                  <div className="orders-card-bottomRow" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 4vw, 16px)' }}>
                    <div style={{ display: 'flex', gap: 'clamp(18px, 14vw, 58px)', alignItems: 'flex-start', flex: '1 1 auto', minWidth: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: 'clamp(12px, 3.6vw, 13px)', color: '#828282', lineHeight: '20px' }}>
                          {scheduledDate ? 'Appointment' : 'Ordered'}
                        </div>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 400, fontSize: 'clamp(12px, 3.6vw, 13px)', color: '#161616', lineHeight: '20px' }}>
                          <div>{scheduledDate ? formatDate(scheduledDate) : formatDate(order.order_date)}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' }}>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: 'clamp(12px, 3.6vw, 13px)', color: '#828282', lineHeight: '20px' }}>
                          Total
                        </div>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 'clamp(15px, 4.8vw, 18px)', color: '#161616', letterSpacing: '-0.035em', lineHeight: '31px' }}>
                          ₹{order.total_amount}
                        </div>
                      </div>
                    </div>

                    <img
                      src={chevronRight}
                      alt=""
                      style={{ width: 'clamp(20px, 6.8vw, 24px)', height: 'clamp(20px, 6.8vw, 24px)', display: 'block', flexShrink: 0 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

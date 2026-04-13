/**
 * Row data: GET /orders/list only (no per-row Thyrocare order-details).
 * Fixed copy: page title, tabs, loading/empty strings, status label+colors, column labels (Appointment / Ordered / Total).
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'
import { fetchOrders, getEarliestScheduledDate } from '../api/orders'
import type { Order } from '../api/orders'
import noOrdersIllustration from '../assets/figma/No_orders/fi_17569011.svg'

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
    case 'COMPLETED': return 'Completed'
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
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const tabs = ['All', 'Active', 'Completed']

  // Rows use GET /orders/list only; Thyrocare order-details are not fetched per row (avoids N+1).
  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = orders.filter(o => {
    if (activeTab === 'All') return true
    if (activeTab === 'Active') return o.order_status?.toUpperCase() === 'CONFIRMED'
    if (activeTab === 'Completed') return o.order_status?.toUpperCase() === 'COMPLETED'
    return true
  })

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif', overflowX: 'hidden' }}>
      <Navbar
        logoSrc="/favicon.svg"
        logoAlt="Nucleotide"
        links={NAV_LINKS}
        ctaLabel="My Cart"
        hideSearchOnMobile
        onCtaClick={() => navigate('/cart')}
      />

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
        <span style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>Orders</span>
      </div>

      <div className="orders-inner" style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', boxSizing: 'border-box', width: '100%' }}>

        {/* Header */}
        <div className="orders-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 'clamp(15px, 1.3vw, 20px)', fontWeight: 500, color: '#161616' }}>Order Management</span>
            <span style={{ fontSize: 'clamp(11px, 0.9vw, 14px)', color: '#828282' }}>Track and manage your diagnostic appointments.</span>
          </div>
          <div className="orders-tabs" style={{ display: 'flex', background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)', borderRadius: 100, outline: '1px solid #E7E1FF', outlineOffset: -1, padding: 8, gap: 0 }}>
            {tabs.map(t => {
              const isActive = activeTab === t
              return (
                <button key={t} onClick={() => setActiveTab(t)} style={{
                  padding: '6px clamp(12px, 1.5vw, 22px)', borderRadius: 100, border: 'none',
                  background: isActive ? '#fff' : 'transparent',
                  boxShadow: isActive ? '0px 4px 27.3px rgba(0,0,0,0.05)' : 'none',
                  outline: isActive ? '1px solid #E7E1FF' : 'none', outlineOffset: -1,
                  color: isActive ? '#8B5CF6' : '#161616',
                  fontSize: 'clamp(11px, 0.9vw, 14px)', fontWeight: 500,
                  cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Poppins, sans-serif',
                }}>{t}</button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <p style={{ color: '#828282', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>Loading orders...</p>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, padding: '60px 20px' }}>
            {/* Illustration */}
            <div style={{
              width: 'clamp(200px, 28vw, 400px)', aspectRatio: '1',
              background: 'linear-gradient(180deg, #E7E1FF 0%, #fff 100%)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src={noOrdersIllustration} alt="No orders" style={{ width: '34%', height: 'auto' }} />
            </div>
            {/* Text */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, maxWidth: 470, textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 'clamp(22px, 2vw, 32px)', fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif' }}>
                No Orders Yet
              </h2>
              <p style={{ margin: 0, fontSize: 'clamp(14px, 1.2vw, 20px)', color: '#414141', fontFamily: 'Poppins, sans-serif', fontWeight: 400, lineHeight: 1.45 }}>
                You haven't booked any tests or packages. Your orders will appear here once you make a booking.
              </p>
            </div>
            {/* CTA */}
            <button
              onClick={() => navigate('/packages')}
              style={{
                width: '100%', maxWidth: 470, height: 58,
                background: '#8B5CF6', border: 'none', borderRadius: 10,
                color: '#fff', fontSize: 'clamp(14px, 1.2vw, 20px)', fontWeight: 500,
                fontFamily: 'Poppins, sans-serif', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              Explore Packages
              <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
                <path d="M2 2l8 8-8 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((order, i) => {
              const st = statusStyle(order.order_status)
              const allMembers = order.items.flatMap(item =>
                item.member_address_map.map(m => m.member.name)
              )
              const uniqueMembers = [...new Set(allMembers)]
              const productNames = order.items.map(it => it.product_name).join(', ')
              const scheduledDate = getEarliestScheduledDate(order)

              return (
                <div key={i} onClick={() => navigate('/order-details', { state: { order } })} style={{
                  background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
                  borderRadius: 16, outline: '1px solid #E7E1FF', outlineOffset: -1,
                  padding: '20px 32px', display: 'flex', flexWrap: 'wrap',
                  alignItems: 'center', justifyContent: 'space-between',
                  gap: 12, cursor: 'pointer', boxSizing: 'border-box', width: '100%',
                }}>
                  {/* Left */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 220px', minWidth: 0 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, background: st.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <svg width="18" height="20" viewBox="0 0 21 23" fill="none">
                        <path d="M17.5 1H3.5C2.4 1 1.5 1.9 1.5 3V21L5.5 18L10.5 21L15.5 18L19.5 21V3C19.5 1.9 18.6 1 17.5 1Z" stroke={st.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6.5 8h8M6.5 12h5" stroke={st.color} strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 'clamp(13px, 1.1vw, 16px)', fontWeight: 500, color: '#161616' }}>
                          #{order.order_number}
                        </span>
                        <span style={{
                          padding: '2px 8px', background: st.bg, borderRadius: 20,
                          outline: `1px solid ${st.border}`, outlineOffset: -1,
                          fontSize: 'clamp(10px, 0.8vw, 13px)', color: st.color, whiteSpace: 'nowrap',
                        }}>{statusLabel(order.order_status)}</span>
                        {order.payment_status && (
                          <span style={{ fontSize: 'clamp(10px, 0.8vw, 12px)', color: '#828282', whiteSpace: 'nowrap' }}>
                            Payment: {order.payment_status}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 'clamp(10px, 0.8vw, 13px)', color: '#828282' }}>
                          {uniqueMembers.join(', ')}
                        </span>
                        <div style={{ width: 1, height: 14, background: '#8B5CF6', flexShrink: 0 }} />
                        <span style={{ fontSize: 'clamp(10px, 0.8vw, 13px)', color: '#101129' }}>{productNames}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="orders-card-right" style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
                    <div className="orders-card-rightMeta" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                      <div className="orders-card-metaCol orders-card-dateCol" style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'right' }}>
                        <span style={{ fontSize: 'clamp(10px, 0.8vw, 13px)', fontWeight: 500, color: '#828282' }}>
                          {scheduledDate ? 'Appointment' : 'Ordered'}
                        </span>
                        <span style={{ fontSize: 'clamp(10px, 0.8vw, 13px)', color: '#161616', lineHeight: 1.4 }}>
                          {scheduledDate ? formatDate(scheduledDate) : formatDate(order.order_date)}
                        </span>
                      </div>
                      <div className="orders-card-metaCol" style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'right' }}>
                        <span style={{ fontSize: 'clamp(10px, 0.8vw, 13px)', fontWeight: 500, color: '#828282' }}>Total</span>
                        <span style={{ fontSize: 'clamp(14px, 1.3vw, 20px)', fontWeight: 600, color: '#161616' }}>
                          ₹{order.total_amount}
                        </span>
                      </div>
                    </div>
                    <svg width="8" height="14" viewBox="0 0 12 20" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M2 2l8 8-8 8" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

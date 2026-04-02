import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'
import type { CartItem } from '../types'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '#' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

const MOCK_ORDERS = [
  {
    id: '#NUC-8429103', status: 'In Progress',
    statusColor: '#8B5CF6', statusBg: '#E7E1FF', statusBorder: '#E7E1FF',
    iconBg: '#E7E1FF', iconColor: '#8B5CF6',
    patients: 'John Doe, Jane Smith', test: 'Thyroid Profile',
    appointment: 'Sunday, 8th Feb', time: '7:00 AM - 8:00 AM', total: '₹399',
  },
  {
    id: '#NUC-8429103', status: 'Complete',
    statusColor: '#41C9B3', statusBg: '#E6F6F3', statusBorder: '#41C9B3',
    iconBg: '#E6F6F3', iconColor: '#41C9B3',
    patients: 'John Doe, Jane Smith', test: 'Thyroid Profile',
    appointment: 'Sunday, 8th Feb', time: '7:00 AM - 8:00 AM', total: '₹399',
  },
]

interface OrdersPageProps { items: CartItem[] }

export default function OrdersPage(_: OrdersPageProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('All')
  const tabs = ['All', 'Active', 'Completed']

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif', overflowX: 'hidden' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 40px', boxSizing: 'border-box', width: '100%' }}>

        {/* Header row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 'clamp(15px, 1.3vw, 20px)', fontWeight: 500, color: '#161616' }}>Order Management</span>
            <span style={{ fontSize: 'clamp(11px, 0.9vw, 14px)', color: '#828282' }}>Track and manage your diagnostic appointments.</span>
          </div>

          {/* Filter tabs */}
          <div style={{
            display: 'flex', background: '#fff',
            boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
            borderRadius: 100, outline: '1px solid #E7E1FF', outlineOffset: -1,
            padding: 8, gap: 0, flexWrap: 'wrap',
          }}>
            {tabs.map(t => {
              const isActive = activeTab === t
              return (
                <button key={t} onClick={() => setActiveTab(t)} style={{
                  padding: '6px clamp(12px, 1.5vw, 22px)',
                  borderRadius: 100, border: 'none',
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

        {/* Order cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MOCK_ORDERS.map((order, i) => (
            <div key={i} onClick={() => navigate('/order-details')} style={{
              background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
              borderRadius: 16, outline: '1px solid #E7E1FF', outlineOffset: -1,
              padding: '20px 32px', display: 'flex', flexWrap: 'wrap',
              alignItems: 'center', justifyContent: 'space-between',
              gap: 12, cursor: 'pointer', boxSizing: 'border-box', width: '100%',
            }}>
              {/* Left */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 220px', minWidth: 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: order.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="18" height="20" viewBox="0 0 21 23" fill="none">
                    <path d="M17.5 1H3.5C2.4 1 1.5 1.9 1.5 3V21L5.5 18L10.5 21L15.5 18L19.5 21V3C19.5 1.9 18.6 1 17.5 1Z" stroke={order.iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.5 8h8M6.5 12h5" stroke={order.iconColor} strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 'clamp(13px, 1.1vw, 16px)', fontWeight: 500, color: '#161616' }}>{order.id}</span>
                    <span style={{
                      padding: '2px 8px', background: order.statusBg, borderRadius: 20,
                      outline: `1px solid ${order.statusBorder}`, outlineOffset: -1,
                      fontSize: 'clamp(10px, 0.8vw, 13px)', color: order.statusColor, whiteSpace: 'nowrap',
                    }}>{order.status}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 'clamp(10px, 0.8vw, 13px)', color: '#828282' }}>{order.patients}</span>
                    <div style={{ width: 1, height: 14, background: '#8B5CF6', flexShrink: 0 }} />
                    <span style={{ fontSize: 'clamp(10px, 0.8vw, 13px)', color: '#101129' }}>{order.test}</span>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'right' }}>
                    <span style={{ fontSize: 'clamp(10px, 0.8vw, 13px)', fontWeight: 500, color: '#828282' }}>Appointment</span>
                    <span style={{ fontSize: 'clamp(10px, 0.8vw, 13px)', color: '#161616', lineHeight: 1.4 }}>
                      {order.appointment}<br />{order.time}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'right' }}>
                    <span style={{ fontSize: 'clamp(10px, 0.8vw, 13px)', fontWeight: 500, color: '#828282' }}>Total</span>
                    <span style={{ fontSize: 'clamp(14px, 1.3vw, 20px)', fontWeight: 600, color: '#161616' }}>{order.total}</span>
                  </div>
                </div>
                <svg width="8" height="14" viewBox="0 0 12 20" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M2 2l8 8-8 8" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

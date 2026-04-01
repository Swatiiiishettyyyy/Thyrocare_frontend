import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'
import type { CartItem } from '../types'

const NAV_LINKS = [
  { label: 'Tests', href: '/' }, { label: 'Packages', href: '/' },
  { label: 'Reports', href: '#' }, { label: 'Metrics', href: '#' }, { label: 'Orders', href: '/orders' },
]

const MOCK_ORDERS = [
  { id: '#NUC-8429103', status: 'In Progress', statusColor: '#7C5CFC', statusBg: '#EDE9FE', patients: 'John Doe, Jane Smith', test: 'Thyroid Profile', appointment: 'Sunday, 8th Feb', time: '7:00 AM– 8:00 AM', total: '₹399', icon: '🟢' },
  { id: '#NUC-8429103', status: 'Complete', statusColor: '#059669', statusBg: '#D1FAE5', patients: 'John Doe, Jane Smith', test: 'Thyroid Profile', appointment: 'Sunday, 8th Feb', time: '7:00 AM– 8:00 AM', total: '₹399', icon: '✅' },
]

interface OrdersPageProps {
  items: CartItem[]
}

export default function OrdersPage(_: OrdersPageProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('All')

  const tabs = ['All', 'Active', 'Completed']

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Poppins', sans-serif" }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Order Management</h1>
          <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>Track and manage your diagnostic appointments.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: '8px 20px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              border: 'none',
              background: activeTab === t ? '#7C5CFC' : '#fff',
              color: activeTab === t ? '#fff' : '#374151',
              boxShadow: activeTab === t ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
            }}>{t}</button>
          ))}
        </div>

        {/* Order cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MOCK_ORDERS.map((order, i) => (
            <div key={i} onClick={() => navigate('/order-details')} style={{
              background: '#fff', borderRadius: 14, padding: '18px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', border: '1.5px solid #E5E7EB',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {order.icon}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{order.id}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: order.statusColor, background: order.statusBg, borderRadius: 20, padding: '2px 10px' }}>{order.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{order.patients} · {order.test}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>Appointment</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{order.appointment}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{order.time}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>Total</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{order.total}</div>
                </div>
                <span style={{ color: '#9CA3AF', fontSize: 18 }}>›</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import React from 'react'
import type { PackageCardProps } from '../../types'

const PackageCard = React.memo(function PackageCard({ name, badge, description, tests, fasting, price, originalPrice, offerPercent, turnaround, onBook }: PackageCardProps) {
  return (
    <article style={{ background: '#F7F9FF', borderRadius: 16, border: '2px solid #E0E5EF', padding: 24, display: 'flex', flexDirection: 'column', gap: 20, minHeight: 320 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 18, fontWeight: 600, color: '#101129', lineHeight: 1.4, margin: 0, flex: 1 }}>
          {name}
        </h3>
        {badge && (
          <span style={{ flexShrink: 0, background: '#E0EAFF', color: '#101129', fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 100 }}>
            {badge}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, fontWeight: 400, color: '#828282', lineHeight: 1.6, margin: 0 }}>
          {description}
        </p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[`${tests} Tests included`, fasting, `Results ${turnaround}`].map(item => (
            <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#828282' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8B5CF6', flexShrink: 0 }} />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid #E0E5EF' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 700, color: '#101129', lineHeight: 1.2 }}>
            ₹{price}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#828282', textDecoration: 'line-through' }}>₹{originalPrice}</span>
            <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 500, color: '#41C9B3' }}>{offerPercent}</span>
          </div>
        </div>
        <button
          onClick={onBook}
          style={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, fontWeight: 600, color: '#fff', background: '#101129', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}
        >
          Book Now
        </button>
      </div>
    </article>
  )
})

export { PackageCard }

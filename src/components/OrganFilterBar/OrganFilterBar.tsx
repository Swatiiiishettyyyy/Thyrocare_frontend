import React from 'react'
import type { OrganFilterBarProps } from '../../types'

const OrganFilterBar = React.memo(function OrganFilterBar({ organs, onOrganChange }: Omit<OrganFilterBarProps, 'activeOrganId'> & { activeOrganId?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 16, flexWrap: 'nowrap', justifyContent: 'center' }}>
      {organs.map((organ) => {
        return (
          <button
            key={organ.id}
            onClick={() => onOrganChange(organ.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: '#fff',
              border: '1.5px solid #E5E7EB',
              borderRadius: 16, padding: '24px 20px',
              cursor: 'pointer', minWidth: 120,
            }}
          >
            {/* Icon image directly, no circle background */}
            {organ.iconSrc
              ? <img src={organ.iconSrc} alt={organ.label} style={{ width: 120, height: 120, objectFit: 'cover' }} />
              : <span style={{ fontSize: 28 }}>🫀</span>
            }
            {/* Label centered */}
            <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, fontWeight: 600, color: '#111827', textAlign: 'center' ,margin:0}}>
              {organ.label}
            </span>
          </button>
        )
      })}
    </div>
  )
})

export { OrganFilterBar }

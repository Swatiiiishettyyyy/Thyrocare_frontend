import React from 'react'
import type { OrganFilterBarProps } from '../../types'

const OrganFilterBar = React.memo(function OrganFilterBar({ organs, activeOrganId, onOrganChange }: OrganFilterBarProps) {
  return (
    <div className="organ-filter-grid">
      {organs.map((organ) => {
        const isActive = organ.id === activeOrganId
        return (
          <button
            key={organ.id}
            type="button"
            aria-label={organ.label}
            aria-pressed={isActive}
            onClick={() => onOrganChange(organ.id)}
            className={`organ-filter-btn${isActive ? ' shadow-card-purple' : ''}`}
          >
            {organ.iconSrc
              ? <img className="organ-filter-btn__icon" src={organ.iconSrc} alt="" />
              : <span className="organ-filter-btn__emoji" aria-hidden>🫀</span>
            }
            <span className="organ-filter-btn__label">{organ.label}</span>
          </button>
        )
      })}
    </div>
  )
})

export { OrganFilterBar }

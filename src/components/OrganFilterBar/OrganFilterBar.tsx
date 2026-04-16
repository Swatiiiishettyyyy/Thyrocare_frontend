import React from 'react'
import type { OrganFilterBarProps } from '../../types'

const ORGAN_THEME: Record<string, { from: string; to: string; glow: string; iconSize?: number; iconScale?: number }> = {
  // Note: some glyph SVGs have extra internal padding in their viewBox. We apply a slight scale
  // so the *visual* glyph weight matches Vitamins/Hormones.
  heart: { from: '#FFD6EE', to: '#FF62BF', glow: '#FFABDD', iconSize: 51, iconScale: 1.22 },
  liver: { from: '#FFDAAE', to: '#EDC08A', glow: '#F6CD9C', iconSize: 51, iconScale: 1.22 },
  bone: { from: '#F4F2FF', to: '#6D55CC', glow: '#A495E1', iconSize: 40, iconScale: 1.25 },
  kidney: { from: '#FFF4EF', to: '#FFAD96', glow: '#FFAD96', iconSize: 51, iconScale: 1.25 },
  gut: { from: '#B7EDE4', to: '#3DC8B1', glow: '#84DECF', iconSize: 51, iconScale: 1.25 },
  hormones: { from: '#FFD6EE', to: '#D787B7', glow: '#FFABDD', iconSize: 53 },
  vitamins: { from: '#FFDAAE', to: '#EDC08A', glow: '#F6CD9C', iconSize: 43 },
}

const OrganFilterBar = React.memo(function OrganFilterBar({ organs, activeOrganId, onOrganChange }: OrganFilterBarProps) {
  return (
    <div className="organ-filter-grid">
      {organs.map((organ) => {
        const isActive = organ.id === activeOrganId
        const theme = ORGAN_THEME[organ.id] ?? ORGAN_THEME.heart
        return (
          <button
            key={organ.id}
            type="button"
            aria-label={organ.label}
            aria-pressed={isActive}
            onClick={() => onOrganChange(organ.id)}
            className={`organ-filter-btn${isActive ? ' shadow-card-purple' : ''}`}
            style={{
              // CSS variables for Figma-like per-organ gradients (responsive sizing handled in CSS).
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              ['--organ-bubble-from' as any]: theme.from,
              ['--organ-bubble-to' as any]: theme.to,
              ['--organ-glow' as any]: theme.glow,
              ['--organ-icon-size' as any]: theme.iconSize ? `${theme.iconSize}px` : undefined,
              ['--organ-icon-scale' as any]: theme.iconScale ?? undefined,
            }}
          >
            <span className="organ-filter-btn__bubble" aria-hidden="true">
              <img className="organ-filter-btn__icon" src={organ.iconSrc} alt="" loading="lazy" />
            </span>
            <span className="organ-filter-btn__label">{organ.label}</span>
          </button>
        )
      })}
    </div>
  )
})

export { OrganFilterBar }

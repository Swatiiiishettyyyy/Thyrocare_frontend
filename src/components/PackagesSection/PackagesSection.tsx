import React from 'react'
import type { PackagesSectionProps } from '../../types'
import { TestCard } from '../TestCard'
import type { TestCardProps } from '../../types'

const PackagesSection = React.memo(function PackagesSection({ heading, subheading, cards, onViewAll }: PackagesSectionProps) {
  return (
    <section id="packages" className="page-section" style={{
      background: 'linear-gradient(to bottom, #101129 0%, #101129 340px, #ffffff 340px, #ffffff 100%)',
      paddingBottom: 'clamp(40px, 6vmin, 72px)',
      marginTop: 'clamp(28px, 5vmin, 56px)',
    }}>
      {/* Keep card widths consistent with Essential Tests */}
      <div className="page-inner" style={{ maxWidth: 1200 }}>
        <div className="packages-section-header">
          <div className="packages-section-header__text">
            <h2 className="packages-section-header__title type-section">
              {heading}
            </h2>
            <p className="packages-section-header__sub type-lead">
              {subheading}
            </p>
          </div>
          {/* Desktop/tablet CTA sits beside title; mobile CTA is rendered below cards. */}
          <button type="button" className="packages-section-cta packages-section-cta--desktop" onClick={onViewAll}>
            View all packages
          </button>
        </div>

        {/* Cards */}
        <div className="grid-3 packages-grid">
          {(cards ?? []).map((card, idx) => (
            <TestCard
              key={idx}
              thyrocareProductId={card.thyrocareProductId}
              maxBeneficiaries={card.maxBeneficiaries}
              name={card.name}
              description={card.description}
              price={card.price}
              originalPrice={card.originalPrice}
              offerPercent={card.offerPercent}
              tests={card.tests}
              fasting={card.fasting}
              type={card.type as TestCardProps['type']}
            />
          ))}
        </div>

        <div className="packages-section-footer packages-section-footer--mobile">
          <button type="button" className="packages-section-cta packages-section-cta--mobile" onClick={onViewAll}>
            View all packages
          </button>
        </div>
      </div>
    </section>
  )
})

export { PackagesSection }

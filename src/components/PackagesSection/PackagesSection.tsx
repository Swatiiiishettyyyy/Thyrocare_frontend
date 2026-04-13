import React from 'react'
import type { PackagesSectionProps } from '../../types'
import { TestCard } from '../TestCard'
import type { TestCardProps } from '../../types'

const PackagesSection = React.memo(function PackagesSection({ heading, subheading, cards, onViewAll }: PackagesSectionProps) {
  return (
    <section id="packages" className="page-section" style={{
      background: 'linear-gradient(to bottom, #101129 0%, #101129 340px, #ffffff 340px, #ffffff 100%)',
      paddingBottom: 60,
      marginTop: 40,
    }}>
      <div className="page-inner">
        <div className="packages-section-header">
          <div className="packages-section-header__text">
            <h2 className="packages-section-header__title">
              {heading}
            </h2>
            <p className="packages-section-header__sub">
              {subheading}
            </p>
          </div>
          <button type="button" className="packages-section-cta" onClick={onViewAll}>
            View All Package
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
      </div>
    </section>
  )
})

export { PackagesSection }

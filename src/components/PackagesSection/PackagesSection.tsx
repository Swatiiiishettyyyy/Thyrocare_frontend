import React from 'react'
import type { PackagesSectionProps } from '../../types'
import { TestCard } from '../TestCard'
import type { TestCardProps } from '../../types'

const PackagesSection = React.memo(function PackagesSection({ heading, subheading, cards }: PackagesSectionProps) {
  return (
    <section id="packages" className="page-section" style={{
      background: 'linear-gradient(to bottom, #1B1F3B 0%, #1B1F3B 55%, #fff 55%, #fff 100%)',
    }}>
      <div className="page-inner">
        {/* Header row: left-aligned title + right "View All" button */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 34, fontWeight: 700, color: '#fff', margin: '0 0 8px', lineHeight: 1.2 }}>
              {heading}
            </h2>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 400, color: '#9CA3AF', margin: 0, lineHeight: 1.6 }}>
              {subheading}
            </p>
          </div>
          <button style={{
            background: '#7C5CFC', color: '#fff', border: 'none',
            borderRadius: 50, padding: '12px 24px', cursor: 'pointer',
            fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 600,
            whiteSpace: 'nowrap', alignSelf: 'center',
          }}>
            View All Package
          </button>
        </div>

        {/* Cards */}
        <div className="grid-3">
          {cards.map((card, idx) => (
            <TestCard
              key={idx}
              name={card.name}
              description={card.description}
              price={card.price}
              originalPrice={card.originalPrice}
              offerPercent={card.offerPercent}
              tests={card.tests}
              fasting={card.fasting}
              turnaround={card.turnaround}
              type={card.type as TestCardProps['type']}
              onAddToCart={() => {}}
            />
          ))}
        </div>
      </div>
    </section>
  )
})

export { PackagesSection }

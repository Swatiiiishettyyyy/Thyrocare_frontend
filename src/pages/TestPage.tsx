import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar, HeroSection, Footer } from '../components'
import { WhyChooseUs } from '../components/WhyChooseUs'
import { HowItWorks } from '../components/HowItWorks'
import { TestCard } from '../components/TestCard'
import { OrganFilterBar } from '../components/OrganFilterBar'
import { PackagesSection } from '../components/PackagesSection'
import type { OrganItem, PackageCardProps } from '../types'
import {
  filterByCategory,
  filterByConditionLabel,
  filterByOrganId,
  toTestCard,
  type ComprehensiveAgeBand,
} from '../api/products'
import { useProductCatalog } from '../hooks/useProductCatalog'
import { womenHealthPath } from './WomenHealthSegmentPage'

import men2550Comp from '../assets/figma/comprehensive/men_25_50-531a98.png'
import men50plus from '../assets/figma/comprehensive/men_50plus-224825.png'
import womenUnder25 from '../assets/figma/comprehensive/women_under25-4ef001.png'
import women2550 from '../assets/figma/comprehensive/women_25_50-317855.png'
import women50plus from '../assets/figma/comprehensive/women_50plus-2cf069.png'
import menUnder25 from '../assets/figma/comprehensive/men_under25-4e32c2.png'
import heartImg from '../assets/figma/Heart.png'
import liverImg from '../assets/figma/liver.png'
import boneImg from '../assets/figma/Bone.png'
import kidneyImg from '../assets/figma/kidney.png'
import gutImg from '../assets/figma/Gut.png'
import hormoneImg from '../assets/figma/Hormone.png'
import vitaminsImg from '../assets/figma/Vitamin.png'
import rect20 from '../assets/figma/Rectangle 20.png'
import rect19 from '../assets/figma/Rectangle 19.png'

const NAV_LINKS = [
  { label: 'Tests', href: '#tests' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

const ORGANS: OrganItem[] = [
  { id: 'heart', label: 'Heart', iconSrc: heartImg },
  { id: 'liver', label: 'Liver', iconSrc: liverImg },
  { id: 'bone', label: 'Bone', iconSrc: boneImg },
  { id: 'kidney', label: 'Kidney', iconSrc: kidneyImg },
  { id: 'gut', label: 'Gut', iconSrc: gutImg },
  { id: 'hormones', label: 'Hormones', iconSrc: hormoneImg },
  { id: 'vitamins', label: 'Vitamins', iconSrc: vitaminsImg },
]

const CONDITIONS = ['STD', 'Monsoon Fever', 'Allergy', 'Cancer']

const HOME_CARD_LIMIT = 3
const ESSENTIAL_PAGE_SIZE = 3
const ESSENTIAL_MAX_ITEMS = 12

const sectionHeader = (title: string, subtitle: string) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 40 }}>
    <h2 style={{ fontFamily: 'Poppins,sans-serif', fontSize: 36, fontWeight: 600, color: '#101129', margin: 0, textAlign: 'center' }}>{title}</h2>
    <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: 15, color: '#828282', margin: 0, textAlign: 'center', maxWidth: 560 }}>{subtitle}</p>
  </div>
)

const womenComprehensiveSlots: { label: string; age: ComprehensiveAgeBand; bg: string; circleBg: string; img: string }[] = [
  { label: 'Under 25', age: 'under25', bg: '#E6F6F3', circleBg: 'linear-gradient(180deg, #41C9B3 0%, #E6FFFB 100%)', img: womenUnder25 },
  { label: '25-50', age: '25_50', bg: '#FFF4EF', circleBg: 'linear-gradient(180deg, #FFAD96 0%, #FFF4EF 100%)', img: women2550 },
  { label: '50+', age: '50plus', bg: '#E7E1FF', circleBg: 'linear-gradient(180deg, #8B5CF6 0%, #E7E1FF 100%)', img: women50plus },
]

const menComprehensiveSlots: { label: string; age: ComprehensiveAgeBand; bg: string; circleBg: string; img: string }[] = [
  { label: 'Under 25', age: 'under25', bg: '#E6F6F3', circleBg: 'linear-gradient(180deg, #41C9B3 0%, #E6FFFB 100%)', img: menUnder25 },
  { label: '25-50', age: '25_50', bg: '#FFF4EF', circleBg: 'linear-gradient(180deg, #FFAD96 0%, #FFF4EF 100%)', img: men2550Comp },
  { label: '50+', age: '50plus', bg: '#E7E1FF', circleBg: 'linear-gradient(180deg, #8B5CF6 0%, #E7E1FF 100%)', img: men50plus },
]

export default function TestPage({ cartCount }: { cartCount?: number }) {
  const [activeOrgan, setActiveOrgan] = useState('heart')
  const [activeCondition, setActiveCondition] = useState('STD')
  const [essentialPage, setEssentialPage] = useState(0)
  const navigate = useNavigate()
  const { products, ready, error: loadError } = useProductCatalog()

  const essentialCards = useMemo(
    () => filterByCategory(products, 'Essential Tests').slice(0, ESSENTIAL_MAX_ITEMS).map(toTestCard),
    [products],
  )
  const essentialPages = Math.max(1, Math.ceil(essentialCards.length / ESSENTIAL_PAGE_SIZE))

  const popularCards = useMemo(
    () =>
      filterByCategory(products, 'Popular Packages')
        .slice(0, HOME_CARD_LIMIT)
        .map(p => ({ ...toTestCard(p), badge: 'Package' })) as PackageCardProps[],
    [products],
  )

  const conditionCards = useMemo(
    () => filterByConditionLabel(products, activeCondition).slice(0, HOME_CARD_LIMIT).map(toTestCard),
    [products, activeCondition],
  )

  const heartVitalsCards = useMemo(
    () => filterByOrganId(products, 'heart').slice(0, HOME_CARD_LIMIT).map(toTestCard),
    [products],
  )

  const handleOrganChange = useCallback(
    (id: string) => {
      if (id === 'heart') {
        setActiveOrgan('heart')
        return
      }
      navigate(`/vitals/${id}`)
    },
    [navigate],
  )

  const openComprehensive = useCallback(
    (gender: 'women' | 'men', age: ComprehensiveAgeBand) => {
      navigate(`/comprehensive/${gender}?age=${age}`)
    },
    [navigate],
  )

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins,sans-serif' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} cartCount={cartCount} />

      <main>
        <HeroSection />

        {/* Essential Tests */}
        <section id="tests" className="page-section" style={{ background: '#fff', paddingBottom: 20 }}>
          <div className="page-inner" style={{ maxWidth: 1200 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 40 }}>
              <h2 style={{ fontFamily: 'Poppins,sans-serif', fontSize: 36, fontWeight: 600, color: '#111827', margin: 0, textAlign: 'center', lineHeight: 1.3, letterSpacing: '-0.02em' }}>Essential Tests</h2>
              <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: 15, color: '#828282', margin: 0, textAlign: 'center', maxWidth: 560 }}>Quick, commonly recommended tests to help you monitor your basic health markers.</p>
            </div>
            <div className="essential-carousel">
              <div className="essential-carousel__row">
                <div className="essential-carousel__viewport">
                  <div className="grid-3 essential-grid">
              {loadError && (
                <p style={{ color: '#E12D2D', fontFamily: 'Inter,sans-serif', fontSize: 13, gridColumn: '1 / -1' }}>Failed to load: {loadError}</p>
              )}
              {!loadError && !ready && (
                <>
                  <div className="test-card-skeleton" aria-hidden />
                  <div className="test-card-skeleton" aria-hidden />
                  <div className="test-card-skeleton" aria-hidden />
                </>
              )}
            {!loadError && ready && essentialCards.slice(essentialPage * ESSENTIAL_PAGE_SIZE, essentialPage * ESSENTIAL_PAGE_SIZE + ESSENTIAL_PAGE_SIZE).map((t, i) => (
                <TestCard key={`${t.thyrocareProductId ?? t.name}-${essentialPage}-${i}`} {...t} />
              ))}
              {!loadError && ready && essentialCards.length === 0 && (
                <p style={{ color: '#828282', fontFamily: 'Inter,sans-serif', fontSize: 13, gridColumn: '1 / -1' }}>
                  No essential tests are available in the catalog right now.
                </p>
              )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEssentialPage(p => Math.max(0, p - 1))}
                  disabled={essentialPage <= 0}
                  aria-label="Previous essential tests"
                  className="essential-carousel__sideBtn essential-carousel__sideBtn--prev"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setEssentialPage(p => Math.min(essentialPages - 1, p + 1))}
                  disabled={essentialPage >= essentialPages - 1}
                  aria-label="Next essential tests"
                  className="essential-carousel__sideBtn essential-carousel__sideBtn--next"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Check Your Vitals */}
        <section id="vitals" className="page-section" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #E7E1FF 100%)', paddingTop: 40 }}>
          <div className="page-inner">
            {sectionHeader('Check Your Vitals', 'Quick health checks organised by key organs to help you understand what to test.')}
            <OrganFilterBar organs={ORGANS} activeOrganId={activeOrgan} onOrganChange={id => { handleOrganChange(id); navigate(`/vitals/${id}`) }} />
          </div>
        </section>

        {/* Find Tests by Health Condition */}
        <section className="page-section" style={{ background: '#fff', position: 'relative', overflow: 'hidden' }}>
          <img src={rect20} alt="" aria-hidden="true" style={{
            position: 'absolute', top: -80, left: -280, width: 650, height: 900,
            pointerEvents: 'none', zIndex: 0, opacity: 0.7,
          }} />
          <img src={rect19} alt="" aria-hidden="true" style={{
            position: 'absolute', bottom: -380, right: -180, width: 650, height: 900,
            pointerEvents: 'none', zIndex: 0, opacity: 0.7,
          }} />
          <div className="page-inner" style={{ position: 'relative', zIndex: 1, maxWidth: 1200 }}>
            {sectionHeader('Find Tests by Health Condition', 'Select a condition to quickly see the most relevant tests and packages.')}
            <div className="condition-pills">
              {CONDITIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCondition(c)}
                  className={`condition-pill-btn${c === activeCondition ? ' condition-pill-btn--active' : ''}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="grid-3">
              {loadError && (
                <p style={{ color: '#E12D2D', fontFamily: 'Inter,sans-serif', fontSize: 13, gridColumn: '1 / -1' }}>{loadError}</p>
              )}
              {!loadError && !ready && (
                <>
                  <div className="test-card-skeleton" aria-hidden />
                  <div className="test-card-skeleton" aria-hidden />
                  <div className="test-card-skeleton" aria-hidden />
                </>
              )}
              {!loadError && ready && conditionCards.length === 0 && (
                <p style={{ color: '#828282', fontFamily: 'Inter,sans-serif', fontSize: 13, gridColumn: '1 / -1' }}>
                  No matches for &ldquo;{activeCondition}&rdquo; in the catalog. Try another condition.
                </p>
              )}
              {!loadError && ready && conditionCards.map((t, i) => (
                <TestCard key={`${t.thyrocareProductId ?? t.name}-${i}`} {...t} />
              ))}
            </div>
          </div>
        </section>

        {/* Popular Packages */}
        <PackagesSection
          heading="Popular Health Packages"
          subheading="Most booked preventive health packages, recommended for regular health monitoring."
          cards={popularCards}
          onViewAll={() => navigate('/packages')}
        />

        {/* Comprehensive Health Packages */}
        <section id="comprehensive" className="page-section" style={{ background: '#fff', position: 'relative', overflow: 'hidden' }}>
          <img src={rect20} alt="" aria-hidden="true" style={{
            position: 'absolute', top: -80, left: -260, width: 620, height: 820,
            pointerEvents: 'none', zIndex: 0, opacity: 0.5,
          }} />
          <img src={rect19} alt="" aria-hidden="true" style={{
            position: 'absolute', bottom: -300, left: -180, width: 560, height: 760,
            pointerEvents: 'none', zIndex: 0, opacity: 0.4,
          }} />
          <img src={rect19} alt="" aria-hidden="true" style={{
            position: 'absolute', top: -100, right: -220, width: 620, height: 820,
            pointerEvents: 'none', zIndex: 0, opacity: 0.5, transform: 'scaleX(-1)',
          }} />
          <img src={rect20} alt="" aria-hidden="true" style={{
            position: 'absolute', bottom: -280, right: -180, width: 560, height: 760,
            pointerEvents: 'none', zIndex: 0, opacity: 0.4, transform: 'scaleX(-1)',
          }} />
          <div className="page-inner comp-layout" style={{ position: 'relative', zIndex: 1, maxWidth: 1200 }}>

            <div className="comp-heading">
              <h2 style={{ fontFamily: 'Poppins,sans-serif', fontSize: 32, fontWeight: 600, color: '#101129', margin: '0 0 12px', lineHeight: 1.2 }}>
                Comprehensive Health<br />Packages
              </h2>
              <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: 14, fontWeight: 400, color: '#828282', margin: 0, lineHeight: 1.5 }}>
                Preventive packages tailored by age and gender for deeper health screening.
              </p>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

              <div>
                <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 13, fontWeight: 500, color: '#101129', display: 'block', marginBottom: 8 }}>Women</span>
                <div className="comp-avatar-row" style={{ display: 'flex', gap: 12 }}>
                  {womenComprehensiveSlots.map((card, i) => (
                    <button
                      key={i}
                      type="button"
                      className="comp-avatar-card"
                      onClick={() => navigate(womenHealthPath(card.age))}
                      style={{
                        flex: 1, background: card.bg, borderRadius: 14, border: 'none', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        padding: '16px 12px 12px', gap: 8, overflow: 'hidden', minWidth: 0, maxWidth: 180, aspectRatio: '5/5',
                      }}
                    >
                      <div className="comp-avatar-circle" style={{ width: 120, height: 120, borderRadius: '50%', background: card.circleBg, overflow: 'hidden', flexShrink: 0 }}>
                        <img src={card.img} alt={card.label} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                      </div>
                      <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 12, fontWeight: 500, color: '#101129', textAlign: 'center' }}>{card.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 13, fontWeight: 500, color: '#101129', display: 'block', marginBottom: 8 }}>Men</span>
                <div className="comp-avatar-row" style={{ display: 'flex', gap: 12 }}>
                  {menComprehensiveSlots.map((card, i) => (
                    <button
                      key={i}
                      type="button"
                      className="comp-avatar-card"
                      onClick={() => openComprehensive('men', card.age)}
                      style={{
                        flex: 1, background: card.bg, borderRadius: 14, border: 'none', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        padding: '16px 8px 12px', gap: 8, overflow: 'hidden', minWidth: 0, maxWidth: 180, aspectRatio: '5/5',
                      }}
                    >
                      <div className="comp-avatar-circle" style={{ width: 120, height: 120, borderRadius: '50%', background: card.circleBg, overflow: 'hidden', flexShrink: 0 }}>
                        <img src={card.img} alt={card.label} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                      </div>
                      <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 12, fontWeight: 500, color: '#101129', textAlign: 'center' }}>{card.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>
        <WhyChooseUs />
        <HowItWorks />
      </main>

      <Footer />
    </div>
  )
}

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Navbar, HeroSection, Footer } from '../components'
import { WhyChooseUs } from '../components/WhyChooseUs'
import { HowItWorks } from '../components/HowItWorks'
import { TestCard } from '../components/TestCard'
import { OrganFilterBar } from '../components/OrganFilterBar'
import { PackagesSection } from '../components/PackagesSection'
import type { OrganItem, TestCardProps } from '../types'
import {
  filterByCategory,
  filterByConditionLabel,
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
import heartImg from '../assets/figma/icons/heart_glyph.svg'
import liverImg from '../assets/figma/icons/liver_glyph.svg'
import boneImg from '../assets/figma/icons/bone_glyph.svg'
import kidneyImg from '../assets/figma/icons/kidney_glyph.svg'
import gutImg from '../assets/figma/icons/gut_glyph.svg'
import hormoneImg from '../assets/figma/icons/hormones_glyph.svg'
import vitaminsImg from '../assets/figma/icons/vitamins_glyph.svg'
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
const ESSENTIAL_PAGE_SIZE_DESKTOP = 3
/** Mobile essential carousel: one card per page (viewport + arrows/dots). */
const ESSENTIAL_PAGE_SIZE_MOBILE = 1
const ESSENTIAL_MAX_ITEMS = 12

function readEssentialPageSize(): number {
  if (typeof window === 'undefined') return ESSENTIAL_PAGE_SIZE_DESKTOP
  return window.matchMedia('(max-width: 768px)').matches ? ESSENTIAL_PAGE_SIZE_MOBILE : ESSENTIAL_PAGE_SIZE_DESKTOP
}

type SectionHeaderOpts = { titleColor?: string; subtitleMaxWidth?: number }

const sectionHeader = (title: string, subtitle: string, opts?: SectionHeaderOpts) => (
  <div className="home-section-header">
    <h2 className="type-section" style={{ color: opts?.titleColor ?? '#101129', margin: 0, textAlign: 'center' }}>{title}</h2>
    <p className="type-lead" style={{ color: '#828282', margin: 0, textAlign: 'center', maxWidth: opts?.subtitleMaxWidth ?? 720 }}>{subtitle}</p>
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
  const [activeOrgan, setActiveOrgan] = useState('')
  const [activeCondition, setActiveCondition] = useState('STD')
  const [essentialPage, setEssentialPage] = useState(0)
  const [essentialPageSize, setEssentialPageSize] = useState(readEssentialPageSize)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { products, ready, error: loadError } = useProductCatalog()

  const q = (searchParams.get('q') ?? '').trim()

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const sync = () => setEssentialPageSize(mq.matches ? ESSENTIAL_PAGE_SIZE_MOBILE : ESSENTIAL_PAGE_SIZE_DESKTOP)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const essentialCards = useMemo(
    () => filterByCategory(products, 'Essential Tests').slice(0, ESSENTIAL_MAX_ITEMS).map(toTestCard),
    [products],
  )

  const searchResults = useMemo(() => {
    if (!q) return []
    const needle = q.toLowerCase()
    return products
      .filter(p => {
        const name = (p.name ?? '').toLowerCase()
        const cat = (p.category ?? '').toLowerCase()
        const shortDesc = ((p as any).short_description ?? '').toString().toLowerCase()
        const about = ((p as any).about ?? '').toString().toLowerCase()
        const checks = ((p as any).what_this_test_checks ?? '').toString().toLowerCase()
        const who = ((p as any).who_should_take_this_test ?? '').toString().toLowerCase()
        const why = ((p as any).why_doctors_recommend ?? '').toString().toLowerCase()
        const params = Array.isArray((p as any).parameters)
          ? (p as any).parameters.map((x: any) => String(x?.name ?? '')).join(' ').toLowerCase()
          : ''
        return (
          name.includes(needle)
          || cat.includes(needle)
          || shortDesc.includes(needle)
          || about.includes(needle)
          || checks.includes(needle)
          || who.includes(needle)
          || why.includes(needle)
          || params.includes(needle)
        )
      })
      .slice(0, 60)
      .map(toTestCard)
  }, [products, q])
  const essentialPages = Math.max(1, Math.ceil(essentialCards.length / essentialPageSize) || 1)
  const isEssentialMobileCarousel = essentialPageSize === ESSENTIAL_PAGE_SIZE_MOBILE

  useEffect(() => {
    const last = essentialPages - 1
    setEssentialPage((p) => Math.min(p, last))
  }, [essentialPages])

  const popularCards = useMemo(
    () =>
      filterByCategory(products, 'Popular Packages')
        .slice(0, HOME_CARD_LIMIT)
        .map(p => toTestCard(p)) as TestCardProps[],
    [products],
  )

  const conditionCards = useMemo(
    () => filterByConditionLabel(products, activeCondition).slice(0, HOME_CARD_LIMIT).map(toTestCard),
    [products, activeCondition],
  )

  const handleOrganChange = useCallback(
    (id: string) => {
      setActiveOrgan(id)
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
    <div className="testpage-root" style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins,sans-serif' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} cartCount={cartCount} />

      <main>
        <HeroSection />

        {/* Global keyword search results (from Navbar search) */}
        {q ? (
          <section className="page-section" style={{ background: '#fff' }}>
            <div className="page-inner" style={{ maxWidth: 1200 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, color: '#828282' }}>
                  Showing results for <strong style={{ color: '#101129' }}>"{q}"</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchParams({})}
                  style={{
                    height: 36,
                    padding: '0 14px',
                    borderRadius: 999,
                    border: '1px solid #E7E1FF',
                    background: 'transparent',
                    color: '#6B7280',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              </div>

              {loadError && (
                <p style={{ color: '#E12D2D', fontFamily: 'Inter,sans-serif', fontSize: 13 }}>
                  Failed to load: {loadError}
                </p>
              )}
              {!loadError && !ready && (
                <p style={{ color: '#828282', fontFamily: 'Inter,sans-serif', fontSize: 13 }}>
                  Searching…
                </p>
              )}
              {!loadError && ready && searchResults.length === 0 && (
                <p style={{ color: '#828282', fontFamily: 'Inter,sans-serif', fontSize: 13 }}>
                  No results found. Try another keyword.
                </p>
              )}
              {!loadError && ready && searchResults.length > 0 && (
                <div className="grid-3">
                  {searchResults.map((t, i) => (
                    <TestCard key={`${t.thyrocareProductId ?? t.name}-${q}-${i}`} {...t} />
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : null}

        {/* Essential Tests */}
        <section id="tests" className="page-section home-section--essential">
          <div className="page-inner" style={{ maxWidth: 1200 }}>
            {sectionHeader(
              'Essential Tests',
              'Quick, commonly recommended tests to help you monitor your basic health markers.',
              { titleColor: '#111827', subtitleMaxWidth: 856 }
            )}
            <div className="essential-carousel">
              <div className="essential-carousel__row">
                <div className="essential-carousel__viewport">
                  <div className="grid-3 essential-grid">
              {loadError && (
                <p style={{ color: '#E12D2D', fontFamily: 'Inter,sans-serif', fontSize: 13, gridColumn: '1 / -1' }}>Failed to load: {loadError}</p>
              )}
              {!loadError && !ready &&
                Array.from({ length: essentialPageSize }, (_, i) => (
                  <div key={i} className="test-card-skeleton" aria-hidden />
                ))}
            {!loadError &&
              ready &&
              (isEssentialMobileCarousel
                ? essentialCards.map((t, i) => (
                    <TestCard key={`${t.thyrocareProductId ?? t.name}-${i}`} {...t} />
                  ))
                : essentialCards
                    .slice(essentialPage * essentialPageSize, essentialPage * essentialPageSize + essentialPageSize)
                    .map((t, i) => (
                      <TestCard key={`${t.thyrocareProductId ?? t.name}-${essentialPage}-${i}`} {...t} />
                    )))}
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
              {!isEssentialMobileCarousel && essentialPages > 1 ? (
                <div className="essential-carousel__dots" role="tablist" aria-label="Essential tests pages">
                  {Array.from({ length: essentialPages }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={essentialPage === i}
                      aria-label={`Essential tests page ${i + 1} of ${essentialPages}`}
                      className={`essential-carousel__dot${essentialPage === i ? ' essential-carousel__dot--active' : ''}`}
                      onClick={() => setEssentialPage(i)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* Check Your Vitals */}
        <section id="vitals" className="page-section home-section--vitals">
          <div className="page-inner page-inner--wide">
            {sectionHeader('Check Your Vitals', 'Quick health checks organised by key organs to help you understand what to test.')}
            <OrganFilterBar organs={ORGANS} activeOrganId={activeOrgan} onOrganChange={handleOrganChange} />
          </div>
        </section>

        {/* Find Tests by Health Condition */}
        <section className="page-section home-section--conditions" style={{ background: '#fff', position: 'relative', overflow: 'hidden' }}>
          <img className="conditions-deco" src={rect20} alt="" aria-hidden="true" style={{
            position: 'absolute', top: -80, left: -280, width: 650, height: 900,
            pointerEvents: 'none', zIndex: 0, opacity: 0.7,
          }} />
          <img className="conditions-deco" src={rect19} alt="" aria-hidden="true" style={{
            position: 'absolute', bottom: -380, right: -180, width: 650, height: 900,
            pointerEvents: 'none', zIndex: 0, opacity: 0.7,
          }} />
          <div className="page-inner" style={{ position: 'relative', zIndex: 1, maxWidth: 1200 }}>
            {sectionHeader('Find Tests by Health Condition', 'Select a condition to quickly see the most relevant tests and packages.')}
            <div className="condition-pills conditions-pills">
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
            <div className="grid-3 conditions-grid">
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
              <h2 className="type-section" style={{ color: '#101129', margin: '0 0 12px' }}>
                <span className="comp-title-line">Comprehensive Health</span>
                <span className="comp-title-line">Packages</span>
              </h2>
              <p className="type-lead" style={{ color: '#828282', margin: 0, maxWidth: 'min(560px, 100%)' }}>
                <span style={{ display: 'block' }}>Preventive packages tailored by age and gender for</span>
                <span style={{ display: 'block' }}>deeper health screening.</span>
              </p>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

              <div>
                <span className="type-subhead" style={{ color: '#101129', display: 'block', marginBottom: 8 }}>Women</span>
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
                      <span className="type-ui" style={{ color: '#101129', textAlign: 'center' }}>{card.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="type-subhead" style={{ color: '#101129', display: 'block', marginBottom: 8 }}>Men</span>
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
                      <span className="type-ui" style={{ color: '#101129', textAlign: 'center' }}>{card.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>
        <PackagesSection
          heading="Popular Health Packages"
          subheading="Most booked preventive health packages, recommended for regular health monitoring."
          cards={popularCards}
          onViewAll={() => navigate('/packages')}
        />
        <WhyChooseUs />
        <HowItWorks />
      </main>

      <Footer />
    </div>
  )
}

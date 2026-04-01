import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar, HeroSection, Footer } from '../components'
import { WhyChooseUs } from '../components/WhyChooseUs'
import { HowItWorks } from '../components/HowItWorks'
import { TestCard } from '../components/TestCard'
import { OrganFilterBar } from '../components/OrganFilterBar'
import { PackagesSection } from '../components/PackagesSection'
import type { OrganItem, PackageCardProps, TestCardProps } from '../types'

import men2550Img from '../assets/figma/25-50_men.png'
import men50Img from '../assets/figma/50_men.png'
import women50Img from '../assets/figma/50_women.png'
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
  { label: 'Tests',    href: '#tests' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports',  href: '/reports' },
  { label: 'Metrics',  href: '#metrics' },
  { label: 'Orders',   href: '/orders' },
]

const ORGANS: OrganItem[] = [
  { id: 'heart',    label: 'Heart',    iconSrc: heartImg },
  { id: 'liver',    label: 'Liver',    iconSrc: liverImg },
  { id: 'bone',     label: 'Bone',     iconSrc: boneImg },
  { id: 'kidney',   label: 'Kidney',   iconSrc: kidneyImg },
  { id: 'gut',      label: 'Gut',      iconSrc: gutImg },
  { id: 'hormones', label: 'Hormones', iconSrc: hormoneImg },
  { id: 'vitamins', label: 'Vitamins', iconSrc: vitaminsImg },
]

const CONDITIONS = ['STD', 'Monsoon Fever', 'Arthritis', 'Hypertension', 'Cancer']

const ESSENTIAL_TESTS: TestCardProps[] = [
  { name: 'Complete Blood Count (CBC)', description: 'A quick overview of your overall health and immunity.', price: '399', originalPrice: '599', offerPercent: '33% OFF', tests: 29, fasting: 'No Fasting Required', turnaround: 'within 8 hours', type: 'Single' },
  { name: 'HbA1c (Diabetes Check)', description: 'Average blood sugar level for the last 3 months', price: '349', originalPrice: '499', offerPercent: '33% OFF', tests: 3, fasting: 'No Fasting Required', turnaround: 'within 8 hours', type: 'Single' },
  { name: 'Thyroid Profile (T3, T4, TSH)', description: 'Evaluates thyroid function and hormonal balance', price: '399', originalPrice: '599', offerPercent: '33% OFF', tests: 3, fasting: 'Fasting Required', turnaround: 'within 24 hours', type: 'Single' },
]

const CONDITION_TESTS: TestCardProps[] = [
  { name: 'STD Screening Panel', description: 'Comprehensive screening for common sexually transmitted infections', price: '1499', originalPrice: '2199', offerPercent: '32% OFF', tests: 8, fasting: 'No Fasting Required', turnaround: 'within 24 hours', type: 'Package' },
  { name: 'HIV 1 & 2 Test (ELISA)', description: 'Detects HIV infection with high accuracy', price: '499', originalPrice: '799', offerPercent: '37% OFF', tests: 1, fasting: 'No Fasting Required', turnaround: 'within 24 hours', type: 'Single' },
  { name: 'VDRL (Syphilis Test)', description: 'Screens for syphilis infection in early stages', price: '299', originalPrice: '499', offerPercent: '40% OFF', tests: 1, fasting: 'No Fasting Required', turnaround: 'within 24 hours', type: 'Single' },
]

const POPULAR_PACKAGES: PackageCardProps[] = [
  { name: 'Full Body Checkup Basic', badge: 'Package', description: 'Essential blood tests to assess overall health and organ function', tests: 45, fasting: 'Fasting Required', price: '1499', originalPrice: '2499', offerPercent: '40% OFF', turnaround: 'within 24 hours', type: 'Package' },
  { name: 'Heart Health Package', badge: 'Package', description: 'Monitors cholesterol, lipid levels and cardiac risk markers', tests: 18, fasting: 'Fasting Required', price: '999', originalPrice: '1799', offerPercent: '44% OFF', turnaround: 'within 24 hours', type: 'Package' },
  { name: 'Diabetes Care Package', badge: 'Package', description: 'Comprehensive diabetes monitoring with sugar and organ markers', tests: 22, fasting: 'No Fasting Required', price: '899', originalPrice: '1599', offerPercent: '44% OFF', turnaround: 'within 24 hours', type: 'Package' },
]

const sectionHeader = (title: string, subtitle: string) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 40 }}>
    <h2 style={{ fontFamily: 'Poppins,sans-serif', fontSize: 36, fontWeight: 600, color: '#101129', margin: 0, textAlign: 'center' }}>{title}</h2>
    <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: 15, color: '#828282', margin: 0, textAlign: 'center', maxWidth: 560 }}>{subtitle}</p>
  </div>
)

export default function TestPage({ onAddToCart }: { onAddToCart: (test: TestCardProps) => void }) {
  const [activeOrgan, setActiveOrgan] = useState('heart')
  const [activeCondition, setActiveCondition] = useState('STD')
  const navigate = useNavigate()

  const handleOrganChange = useCallback((id: string) => setActiveOrgan(id), [])

  const handleAddToCart = useCallback((test: TestCardProps) => {
    onAddToCart(test)
    navigate('/cart')
  }, [onAddToCart, navigate])

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins,sans-serif' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      <main>
        <HeroSection />

        {/* Essential Tests */}
        <section id="tests" style={{ background: '#fff', padding: '60px 110px' }}>
          <div style={{ maxWidth: 1700, margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 40 }}>
              <h2 style={{ fontFamily: 'Poppins,sans-serif', fontSize: 48, fontWeight: 500, color: '#111827', margin: 0, textAlign: 'center', lineHeight: '61px', letterSpacing: '-0.03em' }}>Essential Tests</h2>
              <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: 15, color: '#828282', margin: 0, textAlign: 'center', maxWidth: 560 }}>Quick, commonly recommended tests to help you monitor your basic health markers.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {ESSENTIAL_TESTS.map((t, i) => <TestCard key={i} {...t} onAddToCart={() => handleAddToCart(t)} />)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
              {[0, 1, 2].map(i => <span key={i} style={{ width: 8, height: 8, borderRadius: 4, background: i === 0 ? '#8B5CF6' : '#E7E1FF' }} />)}
            </div>
          </div>
        </section>

        {/* Check Your Vitals */}
        <section style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #E7E1FF 100%)', padding: '60px 110px' }}>
          <div style={{ maxWidth: 1700, margin: '0 auto' }}>
            {sectionHeader('Check Your Vitals', 'Quick health checks organised by key organs to help you understand what to test.')}
            <OrganFilterBar organs={ORGANS} activeOrganId={activeOrgan} onOrganChange={handleOrganChange} />
          </div>
        </section>

        {/* Find Tests by Health Condition */}
        <section style={{ background: '#fff', padding: '60px 110px', position: 'relative', overflow: 'hidden' }}>
          {/* Rectangle 20 — top left, behind content */}
          <img src={rect20} alt="" aria-hidden="true" style={{
            position: 'absolute', top: -80, left: -280, width: 650 ,height:900,
            pointerEvents: 'none', zIndex: 0, opacity: 0.7,
          }} />
          {/* Rectangle 19 — bottom right, behind content */}
          <img src={rect19} alt="" aria-hidden="true" style={{
            position: 'absolute', bottom: -380, right: -180, width: 650 ,height:900,
            pointerEvents: 'none', zIndex: 0, opacity: 0.7,
          }} />
          <div style={{ maxWidth: 1700, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            {sectionHeader('Find Tests by Health Condition', 'Select a condition to quickly see the most relevant tests and packages.')}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
              {CONDITIONS.map(c => (
                <button key={c} onClick={() => setActiveCondition(c)} style={{
                  padding: '10px 24px', borderRadius: 100,
                  border: c === activeCondition ? '2px solid #8B5CF6' : '1.5px solid #D1D5DB',
                  background: c === activeCondition ? '#EDE9FE' : '#fff',
                  color: c === activeCondition ? '#7C5CFC' : '#374151',
                  fontFamily: 'Poppins,sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                }}>
                  {c}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {CONDITION_TESTS.map((t, i) => <TestCard key={i} {...t} onAddToCart={() => handleAddToCart(t)} />)}
            </div>
          </div>
        </section>

        {/* Popular Packages */}
        <PackagesSection
          heading="Popular Health Packages"
          subheading="Most booked preventive health packages, recommended for regular health monitoring."
          cards={POPULAR_PACKAGES}
        />

        {/* Comprehensive Health Packages */}
        <section style={{ background: '#F8F7FF', padding: '60px 110px' }}>
          <div style={{ maxWidth: 1700, margin: '0 auto', display: 'flex', gap: 60, alignItems: 'flex-start' }}>
            {/* Left heading */}
            <div style={{ minWidth: 260, flexShrink: 0 }}>
              <h2 style={{ fontFamily: 'Poppins,sans-serif', fontSize: 36, fontWeight: 700, color: '#7C5CFC', margin: '0 0 16px', lineHeight: 1.2 }}>
                Comprehensive Health Packages
              </h2>
              <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: 14, color: '#828282', margin: 0, lineHeight: 1.6 }}>
                Preventive packages tailored by age and gender for deeper health screening.
              </p>
            </div>

            {/* Right grid */}
            <div style={{ flex: 1 }}>
              {/* Women */}
              <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: 13, color: '#828282', margin: '0 0 12px', fontWeight: 500 }}>Women</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
                {[
                  { label: 'Under 25', bg: '#C8F5EC', img: null },
                  { label: '25–50',    bg: '#FAE0D8', img: null },
                  { label: '50+',      bg: '#E8E4F8', img: women50Img },
                ].map(card => (
                  <button key={card.label} style={{
                    background: card.bg, borderRadius: 16, border: 'none', cursor: 'pointer',
                    padding: '20px 16px 16px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 12, transition: 'transform 0.15s',
                  }}>
                    <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      {card.img
                        ? <img src={card.img} alt={card.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.3)' }} />
                      }
                    </div>
                    <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 14, fontWeight: 600, color: '#1B1F3B' }}>{card.label}</span>
                  </button>
                ))}
              </div>

              {/* Men */}
              <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: 13, color: '#828282', margin: '0 0 12px', fontWeight: 500 }}>Men</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {[
                  { label: 'Under 25', bg: '#C8F5EC', img: null },
                  { label: '25–50',    bg: '#FAE0D8', img: men2550Img },
                  { label: '50+',      bg: '#E8E4F8', img: men50Img },
                ].map(card => (
                  <button key={card.label} style={{
                    background: card.bg, borderRadius: 16, border: 'none', cursor: 'pointer',
                    padding: '20px 16px 16px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      {card.img
                        ? <img src={card.img} alt={card.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.3)' }} />
                      }
                    </div>
                    <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 14, fontWeight: 600, color: '#1B1F3B' }}>{card.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Nucleotide */}
        <WhyChooseUs />

        {/* How It Works */}
        <HowItWorks />
      </main>

      <Footer />
    </div>
  )
}

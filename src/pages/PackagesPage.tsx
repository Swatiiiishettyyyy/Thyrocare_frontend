import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar, Footer, HeroSection } from '../components'
import { WhyChooseUs } from '../components/WhyChooseUs'
import { HowItWorks } from '../components/HowItWorks'
import { TestCard } from '../components/TestCard'
import type { TestCardProps } from '../types'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '#' },
  { label: 'Orders', href: '/orders' },
]

const CATEGORIES = ['Popular Package', 'Organ Health', "Men's Health", "Women's Health"]

const ALL_PACKAGES: TestCardProps[] = [
  { name: 'Full Body Checkup – Basic', description: 'Essential blood tests to assess overall health and organ function', price: '1499', originalPrice: '2499', offerPercent: '40% OFF', tests: 45, fasting: 'Fasting Required', turnaround: 'within 24 hours', type: 'Package' },
  { name: 'Heart Health Package', description: 'Monitors cholesterol, lipid levels and cardiac risk markers', price: '999', originalPrice: '1799', offerPercent: '44% OFF', tests: 18, fasting: 'Fasting Required', turnaround: 'within 24 hours', type: 'Package' },
  { name: 'Diabetes Care Package', description: 'Comprehensive diabetes monitoring with sugar and organ markers', price: '899', originalPrice: '1599', offerPercent: '44% OFF', tests: 22, fasting: 'No Fasting Required', turnaround: 'within 24 hours', type: 'Package' },
  { name: 'Full Body Checkup – Basic', description: 'Essential blood tests to assess overall health and organ function', price: '1499', originalPrice: '2499', offerPercent: '40% OFF', tests: 45, fasting: 'Fasting Required', turnaround: 'within 24 hours', type: 'Package' },
  { name: 'Heart Health Package', description: 'Monitors cholesterol, lipid levels and cardiac risk markers', price: '999', originalPrice: '1799', offerPercent: '44% OFF', tests: 18, fasting: 'Fasting Required', turnaround: 'within 24 hours', type: 'Package' },
  { name: 'Diabetes Care Package', description: 'Comprehensive diabetes monitoring with sugar and organ markers', price: '899', originalPrice: '1599', offerPercent: '44% OFF', tests: 22, fasting: 'No Fasting Required', turnaround: 'within 24 hours', type: 'Package' },
]

export default function PackagesPage({ onAddToCart }: { onAddToCart: (test: TestCardProps) => void }) {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('Popular Package')

  const handleAddToCart = useCallback((pkg: TestCardProps) => {
    onAddToCart(pkg)
    navigate('/cart')
  }, [onAddToCart, navigate])

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Poppins', sans-serif" }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      <HeroSection />

      <div style={{ maxWidth: 1700, margin: '0 auto' }} className="page-section" >

        {/* Category filter pills */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: '10px 22px', borderRadius: 50, fontSize: 14, fontWeight: 500, cursor: 'pointer',
              border: activeCategory === cat ? 'none' : '1.5px solid #E5E7EB',
              background: activeCategory === cat ? '#1B1F3B' : '#fff',
              color: activeCategory === cat ? '#fff' : '#374151',
              boxShadow: activeCategory === cat ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
            }}>{cat}</button>
          ))}
        </div>

        {/* Package cards grid */}
        <div className="grid-3">
          {ALL_PACKAGES.map((pkg, i) => (
            <TestCard key={i} {...pkg} onAddToCart={() => handleAddToCart(pkg)} />
          ))}
        </div>

      </div>

      <WhyChooseUs />
      <HowItWorks />
      <Footer />
    </div>
  )
}

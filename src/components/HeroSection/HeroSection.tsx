import { useState, useEffect } from 'react'
import banner1 from '../../assets/figma/doctor_banner.png'
import banner2 from '../../assets/figma/Banner2.png'
import banner3 from '../../assets/figma/banner3.png'
import mobileBannerBg from '../../assets/figma/mobile-banner/Frame 1948760703.png'
import mobileNucleotide2 from '../../assets/figma/mobile-banner/nucleotide 2.png'

const BANNERS = [banner1, banner2, banner3]

export function HeroSection() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % BANNERS.length)
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="hero-section" style={{ margin: '16px 12px' }}>
      <div className="hero-shell" style={{ borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
        {/* Mobile-only background shape from Figma (944:7935). */}
        <img
          src={mobileBannerBg}
          alt=""
          aria-hidden="true"
          className="hero-mobile-bg"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'none',
            pointerEvents: 'none',
          }}
        />

        {/* Mobile-only content from Figma (944:7936). */}
        <div
          className="hero-mobile-content"
          style={{
            display: 'none',
          }}
        >
          <div className="hero-mobile-title">
            <span className="hero-mobile-titleLine">Find the Right</span>
            <span className="hero-mobile-titleLine hero-mobile-titleAccent">Lab Tests for Your Health</span>
          </div>
          <div className="hero-mobile-subtitle">
            Browse essential tests, organ-wise checkups, condition-based tests, and preventive packages — all in one place.
          </div>
        </div>

        {/* Mobile-only illustration — asset `nucleotide 2.png` (replaces purple mask + cropped hero). */}
        <div
          className="hero-mobile-illustration"
          style={{ display: 'none' }}
          aria-hidden="true"
        >
          <img
            src={mobileNucleotide2}
            alt=""
            aria-hidden="true"
            className="hero-mobile-illustrationImg"
          />
        </div>

        <div className="hero-track" style={{
          display: 'flex',
          transform: `translateX(-${current * 100}%)`,
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
        }}>
          {BANNERS.map((src, i) => (
            <img key={i} src={src} alt={`Banner ${i + 1}`} className="hero-img" />
          ))}
        </div>
      </div>
      <div className="hero-dots" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
        {BANNERS.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} aria-label={`Go to banner ${i + 1}`} style={{
            width: i === current ? 24 : 8, height: 8, borderRadius: 4, border: 'none',
            cursor: 'pointer', background: i === current ? '#8B5CF6' : '#E7E1FF',
            transition: 'all 0.3s ease', padding: 0,
          }} />
        ))}
      </div>
    </section>
  )
}

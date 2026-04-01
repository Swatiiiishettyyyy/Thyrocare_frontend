import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as fc from 'fast-check'
import { PackageCard } from './PackageCard'

const BASE_PROPS = {
  name: 'Full Body Checkup',
  description: 'Essential blood tests to assess overall health',
  tests: 45,
  fasting: 'Fasting Required',
  price: '₹1499',
  originalPrice: '₹2499',
  offerPercent: '40% OFF',
  turnaround: 'within 24 hours',
  type: 'Package' as const,
}

describe('PackageCard', () => {
  it('renders the package name', () => {
    render(<PackageCard {...BASE_PROPS} />)
    expect(screen.getByText('Full Body Checkup')).toBeTruthy()
  })

  it('renders price and offer percent', () => {
    render(<PackageCard {...BASE_PROPS} />)
    expect(screen.getByText('₹1499')).toBeTruthy()
    expect(screen.getByText('40% OFF')).toBeTruthy()
  })

  it('renders Book Now button', () => {
    render(<PackageCard {...BASE_PROPS} />)
    expect(screen.getByText('Book Now')).toBeTruthy()
  })

  it('renders optional badge when provided', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 20 }), (badge) => {
        const { unmount } = render(<PackageCard {...BASE_PROPS} badge={badge} />)
        expect(screen.getByText(badge)).toBeTruthy()
        unmount()
      })
    )
  })
})

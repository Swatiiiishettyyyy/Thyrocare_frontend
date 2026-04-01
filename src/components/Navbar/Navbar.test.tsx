import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import * as fc from 'fast-check'
import { Navbar } from './Navbar'

/**
 * Validates: Requirements P4
 */

const DEFAULT_PROPS = {
  logoSrc: '/favicon.svg',
  logoAlt: 'Nucleotide',
  links: [{ label: 'Home', href: '#' }],
  ctaLabel: 'Book a Test',
}

describe('P4 — Navbar aria-expanded reflects open state', () => {
  it('aria-expanded on hamburger button always reflects the actual open/closed state', () => {
    // Generate a sequence of toggle actions (number of clicks)
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        (toggleCount) => {
          const { container } = render(<Navbar {...DEFAULT_PROPS} />)
          const hamburger = container.querySelector('button[aria-label="Open navigation menu"]')!

          // Initial state: closed
          expect(hamburger.getAttribute('aria-expanded')).toBe('false')

          // Simulate toggleCount clicks and verify state after each
          for (let i = 0; i < toggleCount; i++) {
            fireEvent.click(hamburger)
            const expectedOpen = (i + 1) % 2 === 1
            expect(hamburger.getAttribute('aria-expanded')).toBe(String(expectedOpen))
          }
        }
      )
    )
  })
})

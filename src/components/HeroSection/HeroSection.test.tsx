/**
 * P6 — Responsive class presence
 * Validates: Requirements 11.7
 *
 * For every component that has responsive variants, the rendered output contains
 * at least one Tailwind responsive prefix class (sm:, md:, lg:, or xl:),
 * ensuring responsive adaptation is not accidentally removed.
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import { HeroSection } from './HeroSection'
import { Navbar } from '../Navbar'
import { OrganFilterBar } from '../OrganFilterBar'
import { PackagesSection } from '../PackagesSection'

const RESPONSIVE_PREFIXES = ['sm:', 'md:', 'lg:', 'xl:']

function hasResponsiveClass(container: HTMLElement): boolean {
  const allClasses = Array.from(container.querySelectorAll('*'))
    .flatMap((el) => Array.from(el.classList))
  return allClasses.some((cls) => RESPONSIVE_PREFIXES.some((prefix) => cls.startsWith(prefix)))
}

describe('P6 — Responsive class presence', () => {
  it('HeroSection contains at least one responsive Tailwind class', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (headline, subtext) => {
          const { container } = render(
            <HeroSection
              headline={headline}
              subtext={subtext}
              illustrationSrc="/test.png"
              illustrationAlt="test"
            />
          )
          expect(hasResponsiveClass(container)).toBe(true)
        }
      )
    )
  })

  it('Navbar contains at least one responsive Tailwind class', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ label: fc.string({ minLength: 1 }), href: fc.constant('#') }),
          { minLength: 1, maxLength: 5 }
        ),
        (links) => {
          const { container } = render(
            <Navbar
              logoSrc="/favicon.svg"
              logoAlt="Logo"
              links={links}
              ctaLabel="CTA"
            />
          )
          expect(hasResponsiveClass(container)).toBe(true)
        }
      )
    )
  })

  it('OrganFilterBar contains at least one responsive Tailwind class', () => {
    const organs = [{ id: 'heart', label: 'Heart', iconSrc: '/icons.svg#heart' }]
    const { container } = render(
      <OrganFilterBar organs={organs} activeOrganId="heart" onOrganChange={vi.fn()} />
    )
    expect(hasResponsiveClass(container)).toBe(true)
  })

  it('PackagesSection contains at least one responsive Tailwind class', () => {
    const groups = [
      {
        gender: 'Women' as const,
        cards: [
          { ageLabel: 'Under 25', imageSrc: '/test.png', imageAlt: 'test', variant: 'teal' as const },
        ],
      },
    ]
    const { container } = render(
      <PackagesSection heading="Packages" subheading="Choose" groups={groups} />
    )
    expect(hasResponsiveClass(container)).toBe(true)
  })
})

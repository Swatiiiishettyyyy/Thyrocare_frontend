import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import { SectionHeading } from './SectionHeading'

/**
 * Validates: Requirements P5
 * P5 — SectionHeading renders title and optional subtitle
 */
describe('P5 — SectionHeading renders title and optional subtitle', () => {
  it('always renders the title text in the h2 element', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (title) => {
          const { container } = render(<SectionHeading title={title} />)
          const h2 = container.querySelector('h2')
          expect(h2).not.toBeNull()
          expect(h2!.textContent).toBe(title)
        }
      )
    )
  })

  it('renders subtitle when provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        (title, subtitle) => {
          const { container } = render(<SectionHeading title={title} subtitle={subtitle} />)
          const p = container.querySelector('p')
          expect(p).not.toBeNull()
          expect(p!.textContent).toBe(subtitle)
        }
      )
    )
  })

  it('does not render subtitle element when subtitle is omitted', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (title) => {
          const { container } = render(<SectionHeading title={title} />)
          const p = container.querySelector('p')
          expect(p).toBeNull()
        }
      )
    )
  })
})

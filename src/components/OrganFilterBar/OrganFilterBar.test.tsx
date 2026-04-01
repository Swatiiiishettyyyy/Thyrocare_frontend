import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import { OrganFilterBar } from './OrganFilterBar'

/**
 * Validates: Requirements P1
 *
 * P1 — OrganFilterBar active state consistency
 * For any list of organs and any valid activeOrganId, exactly one chip renders
 * with the active visual state (shadow-card-purple), and all others render without it.
 */
describe('P1 — OrganFilterBar active state consistency', () => {
  it('exactly one chip has shadow-card-purple for any valid activeOrganId', () => {
    fc.assert(
      fc.property(
        // Generate a non-empty array of unique organ ids
        fc.array(
          fc.record({
            id: fc.uuid(),
            label: fc.string({ minLength: 1, maxLength: 20 }),
            iconSrc: fc.constant('/icons.svg#test'),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (organs) => {
          // Deduplicate by id
          const unique = organs.filter(
            (o, i, arr) => arr.findIndex((x) => x.id === o.id) === i
          )
          if (unique.length === 0) return

          // Pick a random valid activeOrganId
          const activeOrganId = unique[Math.floor(Math.random() * unique.length)].id

          const { container } = render(
            <OrganFilterBar
              organs={unique}
              activeOrganId={activeOrganId}
              onOrganChange={vi.fn()}
            />
          )

          const buttons = container.querySelectorAll('button')
          const activeButtons = Array.from(buttons).filter((btn) =>
            btn.className.includes('shadow-card-purple')
          )

          expect(activeButtons).toHaveLength(1)
          expect(activeButtons[0].getAttribute('aria-label')).toBe(
            unique.find((o) => o.id === activeOrganId)?.label
          )
        }
      )
    )
  })
})

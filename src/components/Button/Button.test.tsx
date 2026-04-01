import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import { Button } from './Button'
import type { ButtonVariant } from '../../types'

/**
 * Validates: Requirements P3
 * P3 — Button variant → class mapping
 * For every ButtonVariant value, the rendered button element contains the correct
 * Tailwind class set for that variant and no conflicting variant classes.
 */

const VARIANT_CLASS_MAP: Record<ButtonVariant, string[]> = {
  primary: ['bg-purple', 'text-white'],
  secondary: ['border-purple', 'text-purple'],
  ghost: ['text-navy'],
}

const CONFLICTING_CLASSES: Record<ButtonVariant, string[]> = {
  primary: ['border-purple', 'text-navy'],
  secondary: ['bg-purple', 'text-navy'],
  ghost: ['bg-purple', 'border-purple'],
}

describe('P3 — Button variant → class mapping', () => {
  it('renders correct classes for each variant with no conflicting variant classes', () => {
    const variantArb = fc.constantFrom<ButtonVariant>('primary', 'secondary', 'ghost')

    fc.assert(
      fc.property(variantArb, (variant) => {
        const { container } = render(
          <Button variant={variant}>Test</Button>
        )

        const btn = container.querySelector('button')!
        const classTokens = btn.className.split(/\s+/)

        // Must contain all expected classes for this variant
        for (const cls of VARIANT_CLASS_MAP[variant]) {
          expect(classTokens).toContain(cls)
        }

        // Must NOT contain conflicting classes from other variants
        for (const cls of CONFLICTING_CLASSES[variant]) {
          expect(classTokens).not.toContain(cls)
        }
      })
    )
  })
})

import React from 'react'

// Button
export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
}

// Badge
export interface BadgeProps {
  label: string
  variant?: 'purple' | 'teal' | 'orange' | 'gray'
}

// SectionHeading
export interface SectionHeadingProps {
  title: string
  subtitle?: string
  align?: 'left' | 'center'
}

// OrganFilterBar
export interface OrganItem {
  id: string
  label: string
  iconSrc: string
}

export interface OrganFilterBarProps {
  organs: OrganItem[]
  activeOrganId: string
  onOrganChange: (id: string) => void
}

// PackagesSection
export interface PackagesSectionProps {
  heading: string
  subheading: string
  cards: TestCardProps[]
  onViewAll?: () => void
}

// TestCard
export interface TestCardProps {
  thyrocareProductId?: number  // API product ID for cart
  maxBeneficiaries?: number    // beneficiaries_max from API
  name: string
  description?: string
  price: string
  originalPrice: string
  offerPercent: string
  tests: number
  fasting: string
  /** Report turnaround copy for the left info tile (Figma). */
  reportTime?: string
  /** Right info tile label: "Parameters" vs "Tests included" for packages. */
  parametersLabel?: string
  /** @deprecated Removed from UI; optional for backward compatibility */
  turnaround?: string
  type: 'Package' | 'Single'
  quantity?: number
}

// Navbar
export interface NavLink {
  label: string
  href: string
}

export interface NavbarProps {
  logoSrc: string
  logoAlt: string
  links: NavLink[]
  ctaLabel: string
  onCtaClick?: () => void
  /** Hide the search row on mobile only (used for checkout/cart pages). */
  hideSearchOnMobile?: boolean
  /**
   * Force which nav item is highlighted (e.g. on detail pages).
   * Use hrefs from `links` such as `/` or `/packages`.
   */
  activeHrefOverride?: string
}

// Footer
export interface SocialLink {
  platform: string
  href: string
  iconId: string
}

export interface FooterProps {
  logoSrc: string
  logoAlt: string
  links: NavLink[]
  socialLinks: SocialLink[]
  copyright: string
}

// Cart
export interface CartItem {
  cartItemId?: number          // API cart item ID (for update/remove)
  thyrocareProductId?: number  // for API add-to-cart
  maxBeneficiaries?: number    // cap for No of Patients
  name: string
  type: 'Package' | 'Single'
  price: string
  originalPrice: string
  quantity: number
}
export interface HeroSectionProps {
  headline: string
  subtext: string
  badgeText?: string
  searchPlaceholder?: string
  illustrationSrc: string
  illustrationAlt: string
}

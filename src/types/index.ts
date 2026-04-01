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

// PackageCard
export type PackageType = 'Package' | 'Single'

export interface PackageCardProps {
  name: string
  badge?: string
  description: string
  tests: number
  fasting: string
  price: string
  originalPrice: string
  offerPercent: string
  turnaround: string
  type: 'Package' | 'Single'
  onBook?: () => void
}

// PackagesSection
export interface PackagesSectionProps {
  heading: string
  subheading: string
  cards: PackageCardProps[]
}

// TestCard
export interface TestCardProps {
  name: string
  description?: string
  price: string
  originalPrice: string
  offerPercent: string
  tests: number
  fasting: string
  turnaround: string
  type: 'Package' | 'Single'
  onAddToCart?: () => void
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

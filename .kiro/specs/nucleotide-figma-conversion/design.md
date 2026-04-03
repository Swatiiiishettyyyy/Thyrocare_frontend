# Design Document

## Overview

This document describes the technical architecture and component design for converting the Nucleotide Figma design into production-ready React + TypeScript code. The project migrates an existing Vite + React JSX app to TypeScript, installs Tailwind CSS with clsx, and implements the full Nucleotide UI as a modular, responsive component library.

The Figma file (`fSDqWAsMDGIYmEt4d6yvOa`) is a blood-testing / health-screening platform called **Nucleotide**. It contains a desktop canvas, mobile canvas, tablet canvas, and a design system canvas. The primary deliverable is the desktop home page with full responsive adaptation.

---

## Architecture

### Technology Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript (strict) |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v3 + clsx |
| Font | Poppins (Google Fonts) |
| Icons | Existing `public/icons.svg` sprite |
| State | React local state only (no external store needed for static UI) |

### Project Structure

```
src/
├── assets/                  # Static images (hero.png, etc.)
├── components/
│   ├── index.ts             # Barrel re-export of all public components
│   ├── Navbar/
│   │   ├── Navbar.tsx
│   │   └── index.ts
│   ├── HeroSection/
│   │   ├── HeroSection.tsx
│   │   └── index.ts
│   ├── OrganFilterBar/
│   │   ├── OrganFilterBar.tsx
│   │   └── index.ts
│   ├── TestCard/
│   │   ├── TestCard.tsx
│   │   └── index.ts
│   ├── PackageCard/
│   │   ├── PackageCard.tsx
│   │   └── index.ts
│   ├── SectionHeading/
│   │   ├── SectionHeading.tsx
│   │   └── index.ts
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── index.ts
│   ├── Badge/
│   │   ├── Badge.tsx
│   │   └── index.ts
│   └── Footer/
│       ├── Footer.tsx
│       └── index.ts
├── hooks/                   # Custom hooks (e.g., useMediaQuery)
├── types/
│   └── index.ts             # Shared TypeScript interfaces
├── App.tsx
├── main.tsx
└── index.css
```

---

## Design Tokens

Extracted from the Figma file's global variables and style guide canvas.

### Color Palette

```ts
// tailwind.config.ts — theme.extend.colors
colors: {
  navy:       '#101129',   // Primary text / headings
  black:      '#161616',   // Body text dark
  purple:     '#8B5CF6',   // Primary accent / CTA
  'purple-light': '#E7E1FF', // Card borders, light bg
  'purple-glow': 'rgba(136,107,249,0.23)', // Card shadow
  teal:       '#41C9B3',   // Sea-green accent
  'teal-light': '#E6F6F3', // Sea-green card bg
  orange:     '#EA8C5A',   // Pale orange accent
  'orange-light': '#FFF4EF', // Orange card bg
  gray:       '#828282',   // Body text secondary
  'gray-bg':  '#F9F9F9',   // Page background light
  white:      '#FFFFFF',
}
```

### Typography

All text uses **Poppins** (loaded via Google Fonts in `index.html`).

| Token | Family | Weight | Size | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| H1 | Poppins | 500 | 56px (desktop) / 36px (mobile) | 1.2 | -1.68px |
| H2-MEDIUM | Poppins | 500 | 48px | 1.27 | -3% |
| H3 | Poppins | 500 | 24px | 1.33 | -3% |
| B1-Regular | Poppins | 400 | 20px | 1.45 | 0 |
| B2-Medium | Poppins | 500 | 20px | 1.3 | 0 |
| B3-Medium | Poppins | 500 | 24px | 1.125 | -2% |

Tailwind custom font-size extensions:

```ts
fontSize: {
  'h1':   ['56px', { lineHeight: '1.2',   letterSpacing: '-1.68px', fontWeight: '500' }],
  'h2':   ['48px', { lineHeight: '1.27',  letterSpacing: '-0.03em', fontWeight: '500' }],
  'h3':   ['24px', { lineHeight: '1.33',  letterSpacing: '-0.03em', fontWeight: '500' }],
  'b1':   ['20px', { lineHeight: '1.45',  fontWeight: '400' }],
  'b2':   ['20px', { lineHeight: '1.3',   fontWeight: '500' }],
  'b3':   ['24px', { lineHeight: '1.125', letterSpacing: '-0.02em', fontWeight: '500' }],
}
```

### Spacing & Border Radius

```ts
borderRadius: {
  card:   '20px',
  pill:   '122px',
  sm:     '5px',
}
```

### Shadows

```ts
boxShadow: {
  'card-purple': '0px 4px 156px 0px rgba(136,107,249,0.23)',
}
```

---

## Component Designs

### 1. Navbar

**Purpose:** Top navigation bar with logo, nav links, and CTA button.

**Props:**
```ts
interface NavbarProps {
  logoSrc: string;
  logoAlt: string;
  links: { label: string; href: string }[];
  ctaLabel: string;
  onCtaClick?: () => void;
}
```

**Behaviour:**
- Desktop (≥1024px): horizontal flex row with logo left, links centre, CTA button right.
- Mobile/Tablet (<1024px): logo left, hamburger icon right; links collapse into a vertical drawer toggled by the hamburger.
- Hamburger button has `aria-expanded` updated on toggle and `aria-label="Open navigation menu"`.
- `<nav aria-label="Main navigation">` wraps the link list.

**Tailwind classes (key):**
- Container: `flex items-center justify-between px-8 py-4 bg-white border-b border-purple-light`
- Links: `hidden lg:flex gap-8 text-b2 text-navy`
- CTA: `bg-purple text-white rounded-pill px-6 py-2 hover:bg-purple/90 transition-colors`
- Hamburger: `lg:hidden`

---

### 2. HeroSection

**Purpose:** Full-width hero with headline, subtext, search bar, and a decorative illustration.

**Props:**
```ts
interface HeroSectionProps {
  headline: string;
  subtext: string;
  searchPlaceholder?: string;
  illustrationSrc: string;
  illustrationAlt: string;
}
```

**Layout:**
- Desktop: two-column grid — text + search left, illustration right.
- Mobile: single column, illustration stacked below text.
- Background: dark navy (`#101129`) with subtle gradient or pattern.

---

### 3. OrganFilterBar

**Purpose:** Horizontal scrollable row of organ filter chips (Heart, Liver, Bone, Kidney, Gut, Hormones, Vitamins). Matches the `Frame 29110` component set in Figma.

**Props:**
```ts
interface OrganItem {
  id: string;
  label: string;
  iconSrc: string;
}

interface OrganFilterBarProps {
  organs: OrganItem[];
  activeOrganId: string;
  onOrganChange: (id: string) => void;
}
```

**Behaviour:**
- Each chip is a `<button>` with icon + label.
- Active chip gets a purple drop-shadow (`shadow-card-purple`) and a `border-purple-light` border.
- Inactive chips have `border-purple-light` border, white background.
- Chip dimensions: 226×258px (desktop), scales down on mobile.
- Horizontal scroll on mobile with `overflow-x-auto`.

**Tailwind classes (key):**
- Container: `flex gap-5 overflow-x-auto pb-2`
- Chip: `flex flex-col items-center justify-end gap-3 p-4 rounded-card border border-purple-light bg-white cursor-pointer transition-shadow`
- Active chip: `shadow-card-purple`

---

### 4. SectionHeading

**Purpose:** Reusable heading block used in "Comprehensive Health Packages" and other sections. Matches the `subheading` component in Figma.

**Props:**
```ts
interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}
```

**Tailwind classes:**
- Title: `text-h2 text-navy font-medium`
- Subtitle: `text-b1 text-gray mt-1`

---

### 5. PackageCard

**Purpose:** Age/gender-segmented health package card. Matches the `Frame 29135` component set (Comprehensive Health Packages section). Cards come in three colour variants: sea-green, orange, purple.

**Props:**
```ts
type PackageVariant = 'teal' | 'orange' | 'purple';

interface PackageCardProps {
  ageLabel: string;          // e.g. "Under 25", "25-50"
  imageSrc: string;
  imageAlt: string;
  variant: PackageVariant;
  isSelected?: boolean;
  onClick?: () => void;
}
```

**Behaviour:**
- Selected card gets a coloured border matching its variant (`border-teal`, `border-orange`, `border-purple`).
- Card dimensions: 254×239px fixed.
- Border radius: `rounded-card` (20px).
- Background colours: teal-light / orange-light / purple-light.

---

### 6. PackagesSection

**Purpose:** Full "Comprehensive Health Packages" section. Renders a `SectionHeading` and two groups (Women / Men), each containing three `PackageCard` components.

**Props:**
```ts
interface PackageGroup {
  gender: 'Women' | 'Men';
  cards: PackageCardProps[];
}

interface PackagesSectionProps {
  heading: string;
  subheading: string;
  groups: PackageGroup[];
}
```

**Layout:**
- Desktop: two columns side by side (Women | Men).
- Mobile: single column stacked.

---

### 7. TestCard

**Purpose:** Individual blood test listing card (used in "Check Your Vitals" and test listing pages).

**Props:**
```ts
interface TestCardProps {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  turnaround?: string;
  onAddToCart?: () => void;
}
```

#### Corrected Figma Spec (v2)

**Card outer shell:** `borderRadius: 20`, `border: 1px solid #E7E1FF`, `padding: 10`, white background.

**Inner gradient area:** `background: linear-gradient(0deg, #E7E1FF 0%, #FFFFFF 100%)` — purple at bottom, white at top. `borderRadius: 10`.

**Layout order (top → bottom):**
1. Badge row (flush to top)
   - Left: Single/Package pill — `background: linear-gradient(131deg, #101129 0%, #2A2C5B 100%)`, `color: #fff`, `borderTopLeftRadius: 10`, `borderBottomRightRadius: 8`, `fontSize: 14`, `fontWeight: 600`, Poppins
   - Right: Fasting badge — white background, `border: 1px solid #E7E1FF`, `borderRadius: 8`, `fontSize: 12`, `fontWeight: 500`, `color: #374151`, `margin: 10px 19px 0 0`
2. Test name — `fontFamily: Poppins`, `fontSize: 24`, `fontWeight: 500`, `color: #161616`, `margin: 30px 0 10px`
3. Description — `fontFamily: Inter`, `fontSize: 18`, `fontWeight: 400`, `color: #828282`
4. Meta boxes row — two boxes side by side, each `width: 201px`, `height: 74px`, white bg, `boxShadow: 0px 4px 53.9px rgba(136,107,249,0.10)`, `borderRadius: 8`
   - Report Time box: label `fontSize: 18`, `fontFamily: Inter`, `color: #828282`; value `fontSize: 18`, `fontFamily: Inter`, `color: #161616`, `paddingLeft: 35`; uses `ReportIcon`
   - Parameters box: label `fontSize: 18`, `fontFamily: Inter`, `color: #828282`; value `fontSize: 18`, `fontFamily: Inter`, `color: #161616`, `paddingLeft: 34`; uses `ParameterIcon` (currently unused — must be added)
5. Dashed divider — `stroke: #8B5CF6`, `strokeDasharray: 4 4`
6. Price + Button row
   - Price: `fontSize: 32`, `fontWeight: 600`, `color: #161616`
   - Original price: `fontSize: 20`, `fontWeight: 500`, `color: #828282`; strikethrough implemented as a sibling `<div>` with `outline: 1px #828282 solid`, `position: relative`, `top: 12px` (not CSS `text-decoration`)
   - Offer badge: `background: #E6F6F3`, `border: 0.2px solid #41C9B3`, `color: #41C9B3`, `fontSize: 20`, `borderRadius: 6`, `padding: 4px 10px`
   - "Add to Cart" button: `background: #8B5CF6`, `color: #fff`, `height: 58px`, `borderRadius: 8`, Poppins `fontSize: 14`, `fontWeight: 600`

---

### 7b. Popular Health Packages Section Background

**Figma spec:** The entire section uses a dark navy background `#101129`.
- Section heading text: `color: 'white'`
- Subheading text: `color: '#9CA3AF'`
- "View All Package" button: `background: #8B5CF6`, aligned to the right of the heading row
- Current `PackagesSection` uses `linear-gradient(to bottom, #1B1F3B …)` — must be changed to solid `#101129`

### 7c. Check Your Vitals Section Gradient

**Figma spec:** `linear-gradient(0deg, #E7E1FF 0%, white 100%)` — purple at bottom, white at top.
**Current implementation:** `linear-gradient(180deg, #FFFFFF 0%, #E7E1FF 100%)` — visually equivalent (same result, different angle notation). No change required.

### 7d. Condition Filter Pills

**Active pill:** `background: #E7E1FF`, `border: 1px solid #6D55CC`, `color: #161616`, `width: 182px`, `height: 57px`, `borderRadius: 67px`
**Inactive pill:** no background (`transparent`), `border: 1px solid #E7E1FF`, `color: #161616`
**Current implementation** uses `#EDE9FE` background and `#8B5CF6` / `#7C5CFC` colors — must be updated to match above.

---

### 8. Button

**Purpose:** Reusable CTA button with variant support.

**Props:**
```ts
type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}
```

**Variants:**
- `primary`: `bg-purple text-white hover:bg-purple/90`
- `secondary`: `border border-purple text-purple hover:bg-purple-light`
- `ghost`: `text-navy hover:underline`

---

### 9. Badge

**Purpose:** Small label chip (e.g. organ category, test type).

**Props:**
```ts
interface BadgeProps {
  label: string;
  variant?: 'purple' | 'teal' | 'orange' | 'gray';
}
```

---

### 10. Footer

**Purpose:** Page footer with logo, links, and social icons.

**Props:**
```ts
interface FooterProps {
  logoSrc: string;
  logoAlt: string;
  links: { label: string; href: string }[];
  socialLinks: { platform: string; href: string; iconId: string }[];
  copyright: string;
}
```

---

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | < 640px | Single column, hamburger nav, stacked cards |
| Tablet | 640px – 1023px | Two-column grid, hamburger nav |
| Desktop | ≥ 1024px | Full multi-column layout, horizontal nav |

Tailwind prefixes used: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px).

---

## State Management

All state is local React state. No external store is needed for the static UI.

| Component | State | Hook |
|---|---|---|
| Navbar | `isMenuOpen: boolean` | `useState` |
| OrganFilterBar | `activeOrganId: string` | lifted to parent or `useState` |
| PackagesSection | `selectedCard: string \| null` | `useState` |

---

## Performance Strategy

- All pure presentational components wrapped with `React.memo`.
- Event callbacks passed to memoised children wrapped with `useCallback`.
- No inline object/array literals in JSX props of memoised components.
- Images use explicit `width` and `height` attributes to prevent layout shift.

---

## Migration Plan (JSX → TSX)

1. Rename `src/App.jsx` → `src/App.tsx`, `src/main.jsx` → `src/main.tsx`.
2. Add `tsconfig.json` (strict mode, `"jsx": "react-jsx"`).
3. Add `tsconfig.node.json` for Vite config.
4. Install Tailwind CSS, PostCSS, Autoprefixer, clsx.
5. Create `tailwind.config.ts` with custom theme tokens.
6. Replace `src/index.css` content with Tailwind directives + Poppins import.
7. Delete `src/App.css` (styles move to Tailwind utilities).
8. Scaffold component directories and implement each component.
9. Wire everything together in `src/App.tsx`.

---

## Correctness Properties

The following properties must hold and will be validated via property-based tests:

### P1 — OrganFilterBar active state consistency
For any list of organs and any valid `activeOrganId`, exactly one chip renders with the active visual state (shadow + selected border), and all others render without it.

### P2 — PackageCard variant → colour class mapping
For every `PackageVariant` value (`teal`, `orange`, `purple`), the rendered card element contains the corresponding background colour class and never contains a background class from a different variant.

### P3 — Button variant → class mapping
For every `ButtonVariant` value, the rendered `<button>` element contains the correct Tailwind class set for that variant and no conflicting variant classes.

### P4 — Navbar aria-expanded reflects open state
When `isMenuOpen` is `true`, the hamburger `<button>` has `aria-expanded="true"`. When `false`, it has `aria-expanded="false"`. This must hold for all toggle sequences.

### P5 — SectionHeading renders title and optional subtitle
For any non-empty `title` string, the heading element contains that exact text. When `subtitle` is provided, the subtitle element contains it. When `subtitle` is omitted, no subtitle element is rendered.

### P6 — Responsive class presence
For every component that has responsive variants, the rendered output contains at least one Tailwind responsive prefix class (`sm:`, `md:`, `lg:`, or `xl:`), ensuring responsive adaptation is not accidentally removed.

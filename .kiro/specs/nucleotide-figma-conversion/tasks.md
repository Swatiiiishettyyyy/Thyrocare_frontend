# Implementation Tasks

## Task List

- [x] 1. Project setup and migration
  - [x] 1.1 Install dependencies: TypeScript, Tailwind CSS, PostCSS, Autoprefixer, clsx
  - [x] 1.2 Create tsconfig.json (strict mode, react-jsx) and tsconfig.node.json
  - [x] 1.3 Create tailwind.config.ts with custom design tokens (colors, typography, spacing, shadows)
  - [x] 1.4 Update src/index.css with Tailwind directives and Poppins Google Font import
  - [x] 1.5 Rename App.jsx → App.tsx and main.jsx → main.tsx; update vite.config.js to vite.config.ts
  - [x] 1.6 Delete src/App.css (styles will be Tailwind utilities)

- [x] 2. Shared types
  - [x] 2.1 Create src/types/index.ts with shared interfaces (OrganItem, PackageCardProps, ButtonVariant, etc.)

- [x] 3. Atomic components
  - [x] 3.1 Implement src/components/Button/Button.tsx (primary / secondary / ghost variants, size sm/md/lg, React.memo)
  - [x] 3.2 Implement src/components/Badge/Badge.tsx (purple / teal / orange / gray variants, React.memo)
  - [x] 3.3 Implement src/components/SectionHeading/SectionHeading.tsx (title + optional subtitle, left/center align, React.memo)
  - [x] 3.4 Create barrel index.ts files for each atomic component directory

- [x] 4. Navbar component
  - [x] 4.1 Implement src/components/Navbar/Navbar.tsx with desktop horizontal nav and mobile hamburger drawer
  - [x] 4.2 Add aria-label="Main navigation" on nav, aria-expanded on hamburger button, useCallback for toggle handler
  - [x] 4.3 Create src/components/Navbar/index.ts barrel

- [x] 5. OrganFilterBar component
  - [x] 5.1 Implement src/components/OrganFilterBar/OrganFilterBar.tsx with organ chip buttons (icon + label)
  - [x] 5.2 Apply active state shadow (shadow-card-purple) and border styling; horizontal scroll on mobile
  - [x] 5.3 Wrap with React.memo; wrap onOrganChange callback with useCallback in parent
  - [x] 5.4 Create src/components/OrganFilterBar/index.ts barrel

- [x] 6. PackageCard and PackagesSection components
  - [x] 6.1 Implement src/components/PackageCard/PackageCard.tsx with teal/orange/purple variant backgrounds and selected border
  - [x] 6.2 Implement PackagesSection that renders SectionHeading + two gender groups (Women/Men) each with three PackageCards
  - [x] 6.3 Responsive layout: two columns desktop, single column mobile
  - [x] 6.4 Wrap PackageCard with React.memo; create barrel index.ts files

- [x] 7. TestCard component
  - [x] 7.1 Implement src/components/TestCard/TestCard.tsx with name, description, price, turnaround, and add-to-cart button
  - [x] 7.2 Wrap with React.memo; create barrel index.ts

- [x] 8. HeroSection component
  - [x] 8.1 Implement src/components/HeroSection/HeroSection.tsx with headline, subtext, search bar, and illustration
  - [x] 8.2 Desktop two-column grid; mobile single column stacked
  - [x] 8.3 Create barrel index.ts

- [x] 9. Footer component
  - [x] 9.1 Implement src/components/Footer/Footer.tsx with logo, links, social icons from icons.svg sprite, copyright
  - [x] 9.2 Responsive layout; create barrel index.ts

- [x] 10. Barrel and App assembly
  - [x] 10.1 Create src/components/index.ts re-exporting all public components
  - [x] 10.2 Rewrite src/App.tsx to compose Navbar, HeroSection, OrganFilterBar, PackagesSection, Footer with typed props and sample data
  - [x] 10.3 Verify vite build compiles without TypeScript errors

- [x] 11. Property-based tests
  - [x] 11.1 Install fast-check and vitest (or jest) as dev dependencies
  - [x] 11.2 Write PBT for P1 — OrganFilterBar active state consistency
  - [x] 11.3 Write PBT for P2 — PackageCard variant → colour class mapping
  - [x] 11.4 Write PBT for P3 — Button variant → class mapping
  - [x] 11.5 Write PBT for P4 — Navbar aria-expanded reflects open state
  - [x] 11.6 Write PBT for P5 — SectionHeading renders title and optional subtitle
  - [x] 11.7 Write PBT for P6 — Responsive class presence

# Requirements Document

## Introduction

This feature converts the Nucleotide Figma design (https://www.figma.com/design/fSDqWAsMDGIYmEt4d6yvOa/Nucleotide-main-file) into production-ready React + TypeScript code within an existing Vite project. The existing JSX project will be migrated to TypeScript, Tailwind CSS will be installed, and the UI will be decomposed into reusable, modular functional components that are fully responsive across mobile, tablet, and desktop breakpoints.

## Glossary

- **App**: The root React application component rendered at the entry point.
- **Component**: A reusable React functional component written in TypeScript.
- **Tailwind_CSS**: The utility-first CSS framework used for all styling.
- **clsx**: A utility for conditionally joining class names.
- **Figma_Design**: The source design file at the provided Figma URL.
- **Breakpoint**: A responsive layout threshold — mobile (<640px), tablet (640px–1023px), desktop (≥1024px).
- **Props**: Typed TypeScript interface properties passed into a Component.
- **Semantic_HTML**: HTML elements chosen for their meaning (e.g., `<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>`).
- **ARIA**: Accessible Rich Internet Applications attributes that improve screen-reader support.
- **TypeScript**: Statically typed superset of JavaScript used for all source files.
- **Vite**: The build tool and dev server used by the project.

---

## Requirements

### Requirement 1: Project Migration to TypeScript

**User Story:** As a developer, I want the project migrated from JSX to TypeScript, so that I get static type checking and better IDE support.

#### Acceptance Criteria

1. THE App SHALL have all source files use the `.tsx` or `.ts` extension instead of `.jsx` or `.js`.
2. THE App SHALL include a `tsconfig.json` configured for strict TypeScript with React JSX support.
3. THE App SHALL include a `tsconfig.node.json` for Vite config type checking.
4. WHEN the project is built with `vite build`, THE App SHALL compile without TypeScript errors.

---

### Requirement 2: Tailwind CSS and clsx Integration

**User Story:** As a developer, I want Tailwind CSS and clsx installed and configured, so that I can apply utility-first styles consistently.

#### Acceptance Criteria

1. THE App SHALL have Tailwind CSS installed as a dev dependency and configured via `tailwind.config.ts` with content paths covering `./index.html` and `./src/**/*.{ts,tsx}`.
2. THE App SHALL have `clsx` installed as a dependency.
3. THE App SHALL import Tailwind's base, components, and utilities directives in the global CSS entry point (`src/index.css`).
4. WHEN a Component applies conditional styles, THE Component SHALL use `clsx` to compose class names.

---

### Requirement 3: Component Decomposition

**User Story:** As a developer, I want the UI broken into reusable, modular functional components, so that each piece is independently maintainable and testable.

#### Acceptance Criteria

1. THE App SHALL decompose the Figma design into a minimum of the following component categories: layout components (e.g., `Navbar`, `Footer`), section components (e.g., `HeroSection`, `FeaturesSection`), and shared/atomic components (e.g., `Button`, `Card`, `Badge`).
2. THE App SHALL place each Component in a dedicated file under `src/components/` following the pattern `src/components/{ComponentName}/{ComponentName}.tsx`.
3. THE App SHALL export each Component as a named export from an `index.ts` barrel file within its directory.
4. WHEN a Component renders repeated items, THE Component SHALL accept a typed array prop and map over it rather than duplicating JSX.

---

### Requirement 4: Typed Props Interface

**User Story:** As a developer, I want all dynamic content driven by props, so that components are reusable with different data.

#### Acceptance Criteria

1. THE Component SHALL define a TypeScript `interface` or `type` for its props, co-located in the same file or a sibling `types.ts`.
2. THE Component SHALL not use `any` as a prop type.
3. WHEN a prop is optional, THE Component SHALL provide a default value via destructuring defaults or `defaultProps`.
4. THE App SHALL pass all text, image sources, href values, and variant flags as props rather than hardcoding them inside the component body.

---

### Requirement 5: Responsive Layout

**User Story:** As a user, I want the UI to be fully responsive, so that it looks correct on mobile, tablet, and desktop screens.

#### Acceptance Criteria

1. THE Component SHALL use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) to adapt layout at each Breakpoint.
2. WHEN the viewport width is below 640px, THE App SHALL render a single-column stacked layout for all multi-column sections.
3. WHEN the viewport width is between 640px and 1023px, THE App SHALL render a two-column grid layout where the Figma design indicates a multi-column arrangement.
4. WHEN the viewport width is 1024px or above, THE App SHALL render the full desktop layout matching the Figma design.
5. THE Navbar SHALL include a hamburger menu toggle visible on viewports below 1024px, replacing the horizontal navigation links.

---

### Requirement 6: Semantic HTML and Accessibility

**User Story:** As a user relying on assistive technology, I want semantic HTML and ARIA attributes, so that the page is navigable and understandable with a screen reader.

#### Acceptance Criteria

1. THE App SHALL use `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, and `<footer>` elements where semantically appropriate.
2. THE Navbar SHALL include `aria-label="Main navigation"` on the `<nav>` element.
3. WHEN an interactive element (button, link) contains only an icon with no visible text, THE Component SHALL include an `aria-label` describing the action.
4. THE App SHALL ensure all `<img>` elements have a non-empty `alt` attribute describing the image, or `alt=""` for purely decorative images.
5. WHEN the hamburger menu is toggled, THE Navbar SHALL update `aria-expanded` on the toggle button to reflect the open/closed state.
6. THE App SHALL maintain a logical heading hierarchy (`<h1>` once per page, followed by `<h2>`, `<h3>` in order).

---

### Requirement 7: Performance — Avoiding Unnecessary Re-renders

**User Story:** As a developer, I want components optimised to avoid unnecessary re-renders, so that the UI remains performant as the component tree grows.

#### Acceptance Criteria

1. THE Component SHALL use `React.memo` to wrap any pure presentational component that receives only primitive or stable object props.
2. WHEN a Component defines a callback passed as a prop to a child, THE Component SHALL wrap that callback with `useCallback`.
3. WHEN a Component performs an expensive derived computation from props or state, THE Component SHALL memoize the result with `useMemo`.
4. THE App SHALL not define inline object or array literals directly inside JSX prop values for components wrapped with `React.memo`.

---

### Requirement 8: Folder Structure and Code Organisation

**User Story:** As a developer, I want a clean, predictable folder structure, so that I can locate and maintain any part of the codebase quickly.

#### Acceptance Criteria

1. THE App SHALL organise source files under the following top-level directories within `src/`: `components/`, `assets/`, `hooks/` (if custom hooks are needed), and `types/` (for shared type definitions).
2. THE App SHALL include a root-level `src/components/index.ts` barrel that re-exports all public components.
3. THE App SHALL keep each Component's styles expressed entirely through Tailwind utility classes; no separate `.css` or `.module.css` files SHALL be created for individual components.
4. WHEN a type or interface is shared across two or more components, THE App SHALL define it in `src/types/` rather than duplicating it.

---

### Requirement 9: Figma Design Fidelity

**User Story:** As a designer, I want the implemented UI to match the Figma design, so that the delivered product reflects the intended visual design.

#### Acceptance Criteria

1. THE App SHALL replicate the colour palette, typography scale, spacing, and border-radius values defined in the Figma design by extending the Tailwind theme in `tailwind.config.ts`.
2. THE App SHALL reproduce all sections visible in the Figma design, including but not limited to: navigation bar, hero section, features/benefits section, and footer.
3. WHEN the Figma design specifies an interactive state (hover, focus, active) for a component, THE Component SHALL implement that state using Tailwind state variants (e.g., `hover:`, `focus:`).
4. THE App SHALL use the same icon set referenced in the Figma design, sourced either from the existing `public/icons.svg` sprite or an equivalent SVG icon library.

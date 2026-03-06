# Super Travel UI Rebuild Design

Full UI rebuild around a luxury-focused, high-contrast design system with bold geometric typography, a signature dusty rose accent, and editorial layout patterns.

## Decisions

- **Scope**: Full restructure of every page, not just a reskin
- **Images**: Full color (no grayscale filter), but scale(1.08) hover effect
- **Brand font**: Rocket Clouds stays for "Nomadhood" wordmark only
- **Border radius**: Adopt rounded corners (24px cards, 16px images, pill CTAs)
- **CLAUDE.md**: Update design context section to reflect new system

## Design System Foundation

### Color Palette

```
Primary background:     #fdf8f3  (warm off-white)
Secondary background:   #f5f0eb  (warm light)
Accent:                 #e4a4bd  (dusty rose)
Primary text:           #262626  (charcoal)
```

All surfaces and text derive from these four colors at varying opacities. No vaporwave gradients. Solid, muted colors only.

### Typography

- **Primary font**: League Spartan (geometric sans-serif, variable weight)
- **Brand font**: Rocket Clouds (Nomadhood wordmark only)
- **Headings**: weight 700-900, tracking-tighter, line-height 0.8
- **Utility labels**: 10px, weight 900, tracking 0.4em, uppercase
- **Body**: relaxed leading, normal weight

### Border Radius

- Cards: 24px
- Images: 16px
- CTAs / pill buttons: full radius (9999px)
- Inputs: 24px
- Remove the global `0px !important` override

### Motion

- All reveal animations: `cubic-bezier(0.16, 1, 0.3, 1)` with 1s duration
- Hover on images: scale(1.08), 0.8s transition
- Card hover: background color shift (white to dusty rose)
- Floating badge: 4s ease-in-out infinite bounce
- Scroll-triggered reveal-up: IntersectionObserver at 0.15 threshold, translateY(40px) to 0

### Shadows and Depth

Minimal. Clean surfaces. Depth via spacing and typography contrast, not shadows. Remove inset box-shadow patterns. Use subtle 1px borders at 5% opacity where needed.

## Navigation

Fixed top, 80px height. Glassmorphism effect.

- Background: `rgba(253, 248, 243, 0.8)`, `backdrop-filter: blur(12px)`, 1px border at 5% opacity
- Left: "NOMADHOOD" in Rocket Clouds bold uppercase
- Center: menu items in 10px uppercase, tracking 0.2em, League Spartan weight 900
- Right: pill CTA (`#e4a4bd` bg, `#262626` text, 32px px, 12px py)
- Alert badge styled to match new palette

## Footer (new component)

Background `#f5f0eb`. 12-column split:
- Left 5 cols: brand logo + mission statement
- Right 7 cols: 3 sub-columns (navigation, social, locations)
- Section headers: 10px bold uppercase `#e4a4bd`, 8px offset underline
- Bottom bar: thin 1px border, 9px text at 30% opacity

## Page Restructuring

### Landing (index.tsx)

- Full viewport hero: massive headline (15vw, line-height 0.8), one word in lowercase italics `#e4a4bd`. Large image card (24px radius). Floating 160px `#e4a4bd` circle with bounce animation.
- Services grid: `#f5f0eb` bg, 3 columns, 1px borders, card hover shifts to `#e4a4bd`
- Featured neighborhoods: staggered 2-column grid, even items offset 100px. 3:4 images, 16px radius. Hover: centered 96px black circle with "View" text.

### Browse (neighborhoods/index.tsx)

- Staggered gallery layout replaces split-view grid + map
- Map: full-width section above or toggled overlay
- Cards: 3:4 image, category label (10px, `#e4a4bd`), 3xl title, metadata tags
- Sort/filter: 10px uppercase labels, pill selectors
- Pagination: `#e4a4bd` active state

### Detail (neighborhoods/[id].tsx)

- Editorial hero: full-width image, massive overlay text
- Stat bar: horizontal with `#e4a4bd` accents
- Score cards: clean sections, 8xl numbers
- Pulse: dusty rose signal dots
- Reviews: 24px radius cards, `#e4a4bd` stars
- Similar neighborhoods: staggered grid

### Dashboard (dashboard.tsx)

- Risk alerts: clean cards with `#e4a4bd` severity
- Stat cards: 3-column services-grid with hover color shift
- Charts: dusty rose primary, charcoal secondary
- News trending: two-column, clean typography
- Activity feed: timeline with dotted vertical line

### Compare (compare.tsx)

- Side-by-side editorial cards, large hero images
- `#e4a4bd` bar fills for score comparison
- Clean table data comparison

### Favorites (favorites.tsx)

- Staggered grid with drag-drop
- Position numbers as floating `#e4a4bd` circles

### Auth (signin, signup)

- Centered card with 24px radius, massive headline, `#e4a4bd` CTA

### Admin pages

- Adopt colors, typography, radius. Keep table layouts with new aesthetic.

### User profile (users/[id].tsx)

- Editorial layout: large avatar, bold name, `#e4a4bd` stat numbers

## Component Rules

### Cards

- Background: `#fdf8f3`, 24px radius
- Hover: bg to `#e4a4bd`, text stays `#262626`
- Image: 16px radius, full color, scale(1.08) hover
- Category label: 10px, `#e4a4bd`, tracking-widest
- Title: 3xl bold
- Metadata: small, 30% opacity

### Buttons

- Primary: `#e4a4bd` bg, `#262626` text, pill-shaped, 10px uppercase, 900 weight, 0.2em tracking
- Secondary: transparent, 1px `#262626` border, pill-shaped
- No shadows

### Score Badges

- Solid `#e4a4bd` circle/pill, `#262626` text. No gradient.

### Stars and Hearts

- Filled: `#e4a4bd`
- Empty: `#262626` at 15%

### Inputs

- 24px radius, `#f5f0eb` bg, 1px border at 5% opacity
- Focus: `#e4a4bd` ring

### Data Viz

- Primary: `#e4a4bd`
- Secondary: `#262626` at 30%
- Grid lines: `#262626` at 5%

### Section Labels

- 10px, weight 900, `#e4a4bd`, tracking 0.4em, uppercase

### Timestamps

- 10px, `#262626` at 30%

### Empty States

- Inline muted text, 30% opacity

### Skeleton Loading

- `#f5f0eb` with subtle pulse, warm palette

### Map

- MapLibre GL, popups/controls match new palette
- Markers: solid `#e4a4bd` fills

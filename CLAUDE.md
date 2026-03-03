# Claude Code Rules

## Git Commits
- NO "Co-Authored-By: Claude" or any AI attribution in commit messages
- Keep commit messages concise and conventional

---

## Design Context

### Users
Digital nomads and experienced remote workers who have used every generic nomad tool and bounced. They're evaluating neighborhoods to live and work from — not browsing travel content. Context: mid-decision, comparing options, looking for signal in the noise. The job: find reliable, data-backed neighborhood intel from people who actually lived there.

### Brand Personality
**Precise. Unadorned. Authoritative.**
This is infrastructure for location decisions, not a lifestyle brand. It should feel like a tool built by someone who hates unnecessary UI.

### Aesthetic Direction
**STRICT MONOCHROME.** Black and white. Zero color. Zero compromise.

When you remove color entirely, every other design decision has to be perfect. Typography, spacing, hierarchy, and motion do ALL the work. There is nowhere to hide.

- **Anti-references**: Bright SaaS dashboards, lifestyle travel sites, anything with gradients/illustrations/emoji
- **References**: Bloomberg terminal, Stripe's data density, Linear's restraint — but darker and sharper
- **Theme**: Dark only. `#050505` ground. White at varying opacities.

### Design Principles
1. **Monochrome is non-negotiable** — No semantic color (no red/green/blue). No named grays. Every shade is `white` at an opacity on `#050505`. State is communicated through opacity, weight, fill vs outline, and motion.
2. **Typography IS the hierarchy** — Two typefaces: `DM Mono` (system chrome) and `Instrument Serif` (display/editorial). 6:1 ratio between display and micro text. Labels are always uppercase, tracked-out, tiny. The contrast between giant serif titles and tiny mono metadata IS the design.
3. **Spacing must have rhythm** — NEVER uniform gaps. Tight for related items (4-8px), generous for section breaks (40-64px). Cards use 20px padding. Grid gaps are 1px. If everything is evenly spaced, it's wrong.
4. **Surfaces, not borders** — Zero `border` property (always `box-shadow: inset`). Zero `border-radius` (except avatar circles). Zero drop shadows. Depth comes from opacity layering only.
5. **Motion is ambient, not decorative** — `fadeUp` entrance stagger (500-600ms, +50-80ms per item). Hover lift with spring easing. Pulse skeletons, never spinners. You notice the stillness, not the animation.

### Color Tokens
```
--bg-root: #050505
--bg-surface-1: rgba(255, 255, 255, 0.015)    /* card backgrounds */
--bg-surface-2: rgba(255, 255, 255, 0.03)     /* elevated surfaces, hover */
--bg-surface-3: rgba(255, 255, 255, 0.06)     /* active states, selected */
--bg-inverse: #ffffff                           /* primary buttons, active nav */

--border-subtle: rgba(255, 255, 255, 0.04)
--border-default: rgba(255, 255, 255, 0.06)
--border-hover: rgba(255, 255, 255, 0.12)
--border-focus: rgba(255, 255, 255, 0.20)

--text-primary: rgba(255, 255, 255, 0.88)
--text-secondary: rgba(255, 255, 255, 0.50)
--text-tertiary: rgba(255, 255, 255, 0.30)
--text-ghost: rgba(255, 255, 255, 0.15)
--text-inverse: #050505
--text-label: rgba(255, 255, 255, 0.25)
```

### Typography Scale
```
--text-display:  clamp(2.5rem, 6vw, 5rem) / 0.90 lh / -0.04em    /* hero only, Instrument Serif */
--text-title:    clamp(2rem, 5vw, 3.5rem) / 0.95 lh / -0.03em    /* page titles, Instrument Serif */
--text-heading:  18px / 1.20 lh / -0.02em                          /* card names, section heads */
--text-body:     11px / 1.70 lh / 0.01em                           /* descriptions, review text */
--text-caption:  10px / 1.40 lh / 0.05em                           /* secondary info */
--text-label:    9px / 1.20 lh / 0.18em                            /* UPPERCASE labels, always */
--text-micro:    8px / 1.20 lh / 0.15em                            /* sub-labels, annotations */
```

### Spacing Scale
```
--space-1: 4px    --space-2: 8px    --space-3: 12px   --space-4: 16px
--space-5: 20px   --space-6: 24px   --space-8: 32px   --space-10: 40px
--space-12: 48px  --space-16: 64px
```

### Component Rules
- **Cards**: `bg-surface-1`, `box-shadow: inset 0 0 0 1px var(--border-default)`, hover → `bg-surface-2` + `translateY(-2px)` + border glow. Padding 20px. No border-radius.
- **Buttons**: Primary = `bg-white text-black` (the ONLY white element). All buttons: no radius, uppercase 10px, `tracking-[0.18em]`, padding `12px 16px`.
- **Stars/Hearts**: White fills + opacity. NEVER yellow or red. Filled = `white/80`, empty = `white/15`.
- **Inputs**: No radius, `bg-surface-2`, inset box-shadow border, `--text-ghost` placeholder.
- **Skeletons**: `bg-surface-2`, pulsing opacity `0.4 → 1 → 0.4`, 2s ease infinite. No spinners ever.
- **Empty states**: Centered, `--text-tertiary`, dry specific copy. No emoji. "No reviews yet. Be the first."
- **Data viz**: Raw HTML/CSS/SVG only. No chart libraries. White opacity bars/lines only.

### Motion
```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
```
- Entrance: fadeUp, 500-600ms, stagger +50-80ms per item, ease-out
- Hover: `translateY(-2px)`, `cubic-bezier(0.34, 1.56, 0.64, 1)`
- Ambient: scanline (2px, `white/[0.03]`, 8s linear infinite), film grain (SVG feTurbulence, 3% opacity)

### Scrollbar
```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.20); }
```

### "Done" Checklist
1. Can't tell which framework built it
2. At least 3 distinct type sizes visible
3. Spacing varies — tight groups + generous breaks
4. No visible borders (only inset box-shadows)
5. No border-radius (except circles)
6. No color anywhere — pure white/opacity on black
7. Motion feels ambient, not decorative
8. Labels are tiny, tracked-out machine annotations
9. Giant serif + tiny mono feel unified
10. Looks like a tool built by someone who hates unnecessary UI

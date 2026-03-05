# Claude Code Rules

## Git Commits
- NO "Co-Authored-By: Claude" or any AI attribution in commit messages
- Keep commit messages concise and conventional

---

## Design Context

### Users
Digital nomads and experienced remote workers who have used every generic nomad tool and bounced. They're evaluating neighborhoods to live and work from, not browsing travel content. Context: mid-decision, comparing options, looking for signal in the noise. The job: find reliable, data-backed neighborhood intel from people who actually lived there.

### Brand Personality
**Precise. Alive. Confident.**
A sharp tool with soul. It should feel like infrastructure built by someone who cares about craft, not sterile corporate software.

### Aesthetic Direction
**Cool lavender-light base, vaporwave accents.** A light background tinted cool (`#F8F6FC`) with purple-tinted surfaces and borders. Vaporwave accent colors bring data to life. The entire palette is harmonized around purple undertones so accents don't feel like sprinkles on a neutral canvas.

- **Theme**: Light. `#F8F6FC` ground (cool lavender-white). Text is deep purple-black (`#1A1028`) at varying opacities. All surfaces, borders, and neutral tones carry a purple tint (`rgba(120, 80, 200, ...)`). Vaporwave gradient accents for interactive and data elements.
- **References**: Nomad List's energy, Linear's structural clarity, Stripe's data density, but with a vaporwave gradient personality.
- **Anti-references**: Generic SaaS dashboards, sterile monochrome tools, warm beige/earthy palettes, anything that feels like a spreadsheet.

### Design Principles
1. **Color has purpose** — Pink and purple accents are used for scores, active states, data visualization, and interactive elements. The light background stays neutral. Color draws the eye to what matters.
2. **Typography IS the hierarchy** — Two typefaces: `Raleway` (all UI text, system chrome, body) and `Rocket Clouds` (branding only, sparingly). Labels are uppercase, tracked-out, tiny. The contrast between large display text and tiny metadata IS the design.
3. **Spacing must have rhythm** — NEVER uniform gaps. Tight for related items (4-8px), generous for section breaks (40-64px). Cards use 20px padding. Grid gaps are 1px.
4. **Surfaces, not borders** — Zero `border` property (always `box-shadow: inset`). Zero `border-radius` (except avatar circles). Zero drop shadows. Depth comes from opacity layering.
5. **Images have life** — NO grayscale filters. Neighborhood photos render in full color. They are a key signal for nomads evaluating a place.
6. **Motion is ambient, not decorative** — `fadeUp` entrance stagger (500-600ms). Hover lift with spring easing. Gradient-shift animation on accent elements. Pulse skeletons, never spinners.
7. **Density over whitespace luxury** — This is a data product. Above the fold tells the whole story. Progressive disclosure: headline numbers first, detail on demand.

### Accent Palette
```
--vapor-pink: #FF6B9D       /* primary accent, scores, active states */
--vapor-magenta: #E8457C    /* destructive, strong emphasis */
--vapor-purple: #B36BFF     /* focus rings, interactive hover, secondary accent */
--vapor-violet: #7B61FF     /* data viz, chart fills */

--gradient-vapor: linear-gradient(135deg, #FF6B9D, #B36BFF)
```

### Base Color Tokens
```
--bg-root: #F8F6FC                              /* cool lavender-white */
--bg-surface-1: rgba(120, 80, 200, 0.03)       /* card backgrounds, purple-tinted */
--bg-surface-2: rgba(120, 80, 200, 0.06)       /* elevated surfaces, hover */
--bg-surface-3: rgba(120, 80, 200, 0.10)       /* active states, selected */
--bg-inverse: #1A1028                            /* primary buttons, deep purple-black */

--border-default: rgba(120, 80, 200, 0.08)     /* purple-tinted borders */
--border-hover: rgba(120, 80, 200, 0.16)
--border-focus: #B36BFF                          /* purple focus ring */

--text-primary: rgba(26, 16, 40, 0.90)         /* deep purple-black */
--text-secondary: rgba(26, 16, 40, 0.58)
--text-tertiary: rgba(26, 16, 40, 0.38)
--text-ghost: rgba(26, 16, 40, 0.22)
--text-inverse: #F8F6FC
```

### Component Rules
- **Cards**: `bg-surface-1`, inset box-shadow border, hover adds purple glow (`box-shadow: 0 0 20px rgba(179,107,255,0.15)`). No border-radius.
- **Buttons**: Primary = `bg-inverse text-inverse`. All buttons: no radius, uppercase 10px, `tracking-[0.18em]`.
- **Score badges**: Use `bg-vapor` gradient background (pink-to-purple) with white text. Gradient shifts animation.
- **Stars/Hearts**: Use `--vapor-pink` for filled, `black/15` for empty. Never yellow.
- **Inputs**: No radius, `bg-surface-2`, inset box-shadow, focus ring uses `--vapor-purple`.
- **Data viz bars**: Pink for primary/dominant, purple for secondary, muted grey for rest. Bars scale relative to max value.
- **Images**: Full color. NO grayscale. Attribution as light text on dark drop-shadow, always visible.
- **Map markers**: Pink-to-purple gradient fills by score.
- **Empty states**: Inline muted text, not full sections. `--text-tertiary`, direct copy. No emoji.
- **Section labels**: 9-10px uppercase, wide tracking, `--text-ghost`. Never competing with data.
- **Timestamps**: Uniform muted style (`text-micro text-[--text-ghost]`), never competing with data.
- **Branding text**: `font-brand` (Rocket Clouds), used only for the "Nomadhood" wordmark. Never for UI text.

---

## Push Pipeline

**Trigger:** User says "run the push pipeline" + a commit message.

**Requirements:** `gh` CLI must be authenticated. Verify with `gh auth status` before starting. Stop and tell the user if it is not.

### Bump Type from Commit Message

| Prefix | Bump |
|--------|------|
| `fix:`, `chore:`, `docs:`, `refactor:`, `style:`, `test:`, `perf:` | patch |
| `feat:` | minor |
| `BREAKING CHANGE` anywhere in message | major |

If the commit message has no recognized prefix, default to patch and note it.

### Steps (execute in order, stop on any error)

1. Run `gh auth status` — stop if not authenticated
2. Read `version` from `package.json`
3. Determine bump type from the commit message using the table above
4. Compute new semver version
5. Update `version` in `package.json`
6. Prepend this block to `CHANGELOG.md` (create the file if it does not exist):
   ```
   ## v{new-version} — {YYYY-MM-DD}

   {commit message}

   ```
7. Stage only `package.json` and `CHANGELOG.md`
8. Commit with the exact message the user provided (no Co-Authored-By, no AI attribution)
9. Create tag: `git tag v{new-version}`
10. Push commit and tag: `git push && git push --tags`
11. Create GitHub release:
    ```bash
    gh release create v{new-version} \
      --title "v{new-version}" \
      --notes "{the changelog entry body — just the commit message line}"
    ```
12. Report the release URL to the user

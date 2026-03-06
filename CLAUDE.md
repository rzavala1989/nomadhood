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
**Warm off-white base, dusty rose accent.** A warm background (`#fdf8f3`) with clean surfaces and a single signature accent color (`#e4a4bd` dusty rose). High-contrast geometric typography drives the visual hierarchy. Editorial layout patterns with staggered grids and bold headlines.

- **Theme**: Light. `#fdf8f3` ground (warm off-white). Text is charcoal (`#262626`) at varying opacities. Surfaces use `#f5f0eb` (warm light). One accent color: `#e4a4bd` (dusty rose) for scores, active states, CTAs, data viz. No gradients.
- **References**: Luxury travel editorial, Aesop's web presence, Cereal Magazine's typography. Bold geometric sans-serif with editorial restraint.
- **Anti-references**: Generic SaaS dashboards, vaporwave/neon palettes, over-decorated interfaces, anything with gradient badges.

### Design Principles
1. **Color has purpose** — Dusty rose (`#e4a4bd`) is the single accent for scores, active states, CTAs, and data viz. The warm off-white background stays clean. Color draws the eye to what matters.
2. **Typography IS the hierarchy** — Two typefaces: `League Spartan` (all UI text, geometric sans-serif, variable weight 700-900 for headings) and `Rocket Clouds` (branding only, "Nomadhood" wordmark). Labels are 10px uppercase, tracking 0.4em, weight 900. The contrast between massive display text (15vw hero) and tiny metadata IS the design.
3. **Spacing must have rhythm** — NEVER uniform gaps. Tight for related items (4-8px), generous for section breaks (40-64px). Cards use 24px padding. Staggered grids offset even items 100px.
4. **Clean surfaces, rounded corners** — Cards: 24px radius. Images: 16px radius. CTAs: pill-shaped (9999px). Inputs: 24px radius. Minimal shadows. Depth via spacing and typography contrast, not shadows. Subtle 1px borders at 5% opacity where needed.
5. **Images have life** — NO grayscale filters. Neighborhood photos render in full color. Hover: scale(1.08) with 0.8s transition. They are a key signal for nomads evaluating a place.
6. **Motion is editorial** — All reveal animations: `cubic-bezier(0.16, 1, 0.3, 1)` with 1s duration. Scroll-triggered reveal-up via IntersectionObserver at 0.15 threshold. Floating badge: 4s ease-in-out infinite bounce. Pulse skeletons, never spinners.
7. **Density over whitespace luxury** — This is a data product. Above the fold tells the whole story. Progressive disclosure: headline numbers first, detail on demand.

### Color Tokens
```
--bg-root: #fdf8f3                              /* warm off-white */
--bg-secondary: #f5f0eb                         /* warm light, section backgrounds */
--accent-rose: #e4a4bd                          /* dusty rose, single accent */
--accent-charcoal: #262626                      /* charcoal, primary text and buttons */

--text-primary: rgba(38, 38, 38, 0.90)         /* charcoal */
--text-secondary: rgba(38, 38, 38, 0.58)
--text-tertiary: rgba(38, 38, 38, 0.38)
--text-ghost: rgba(38, 38, 38, 0.22)
--text-inverse: #fdf8f3

--border-default: rgba(38, 38, 38, 0.05)       /* subtle borders */
--border-hover: rgba(38, 38, 38, 0.10)
--border-focus: #e4a4bd                          /* rose focus ring */
```

### Component Rules
- **Cards**: `surface-card` utility. `#fdf8f3` bg, 24px radius. Hover: bg shifts to `#e4a4bd`, text stays `#262626`.
- **Buttons**: Primary = `btn-pill` (`#e4a4bd` bg, `#262626` text, pill-shaped, 10px uppercase, 900 weight, 0.2em tracking). Secondary = transparent, 1px `#262626` border, pill-shaped. No shadows.
- **Score badges**: Solid `#e4a4bd` circle/pill, `#262626` text. No gradient. Use `badge-accent` utility.
- **Stars/Hearts**: Use `--accent-rose` for filled, `rgba(38,38,38,0.15)` for empty. Never yellow.
- **Inputs**: 24px radius, `#f5f0eb` bg, 1px border at 5% opacity. Focus: `#e4a4bd` ring.
- **Data viz**: Primary: `#e4a4bd`. Secondary: `#262626` at 30%. Grid lines: `#262626` at 5%.
- **Images**: Full color. NO grayscale. 16px radius. Hover: scale(1.08), 0.8s transition. Attribution as overlay text.
- **Map markers**: Solid `#e4a4bd` fills.
- **Empty states**: Inline muted text, 30% opacity. No emoji.
- **Section labels**: 10px, weight 900, `#e4a4bd`, tracking 0.4em, uppercase. Use `section-label-accent` class.
- **Timestamps**: 10px, `#262626` at 30%.
- **Branding text**: `font-brand` (Rocket Clouds), used only for the "Nomadhood" wordmark. Never for UI text.

### Navigation
Fixed top, 80px height. Glassmorphism: `rgba(253, 248, 243, 0.8)` bg, `backdrop-filter: blur(12px)`, 1px border at 5% opacity. Left: "NOMADHOOD" in Rocket Clouds. Center: menu items 10px uppercase. Right: pill CTA.

### Footer
Background `#f5f0eb`. 12-column split: brand + mission left, navigation and info columns right. Section headers: 10px bold uppercase `#e4a4bd` with 8px offset underline.

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

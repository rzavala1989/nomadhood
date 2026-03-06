# Super Travel UI Rebuild Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the entire Nomadhood UI around a luxury-focused, high-contrast "Super Travel" design system with League Spartan typography, dusty rose (#e4a4bd) accent, warm off-white backgrounds, rounded corners, and editorial layout patterns.

**Architecture:** Replace all CSS tokens, typography, colors, and motion. Rewrite every page to match the Super Travel editorial aesthetic: glassmorphism nav, staggered grids, massive typography, scroll-triggered reveals. Keep all tRPC queries, mutations, and data logic intact. Only the presentation layer changes.

**Tech Stack:** Next.js 15 (Pages Router), Tailwind CSS, League Spartan font (new), Rocket Clouds font (kept for wordmark), IntersectionObserver for scroll reveals, cubic-bezier(0.16, 1, 0.3, 1) motion curve.

---

## Task 1: Download and Set Up League Spartan Font

**Files:**
- Create: `public/LeagueSpartan/` directory with font files
- Modify: `src/styles/globals.css` (font-face only, full rewrite in Task 2)

**Step 1: Download League Spartan variable font**

```bash
mkdir -p public/LeagueSpartan
curl -L -o /tmp/league-spartan.zip "https://fonts.google.com/download?family=League+Spartan"
unzip -o /tmp/league-spartan.zip -d /tmp/league-spartan
cp /tmp/league-spartan/LeagueSpartan-VariableFont_wght.ttf public/LeagueSpartan/
rm -rf /tmp/league-spartan /tmp/league-spartan.zip
```

If curl fails, download manually from https://fonts.google.com/specimen/League+Spartan and place the variable font TTF in `public/LeagueSpartan/`.

**Step 2: Verify font file exists**

```bash
ls -la public/LeagueSpartan/
```

Expected: `LeagueSpartan-VariableFont_wght.ttf` present.

**Step 3: Commit**

```bash
git add public/LeagueSpartan/
git commit -m "chore: add League Spartan variable font"
```

---

## Task 2: Rewrite Global CSS Design Tokens

**Files:**
- Rewrite: `src/styles/globals.css`

**Step 1: Rewrite globals.css**

Replace the entire file with the new Super Travel design system tokens. Key changes:
- All purple-tinted colors -> warm off-white/charcoal palette
- Vaporwave accents -> single dusty rose `#e4a4bd`
- Raleway font-face -> League Spartan font-face (keep Rocket Clouds)
- Border radius: `0px` -> contextual (24px cards, 16px images, pill CTAs)
- Animations: fadeUp 500ms -> reveal-up 1s cubic-bezier(0.16, 1, 0.3, 1)
- Remove vaporwave gradients, scanline effects, ambient grid
- Remove inset box-shadow surface utilities -> clean surfaces
- Add bounce-slow keyframe for floating badge
- Add reveal-up animation class

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Fonts ── */
@font-face {
  font-family: 'League Spartan';
  src: url('/LeagueSpartan/LeagueSpartan-VariableFont_wght.ttf') format('truetype');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Rocket Clouds';
  src: url('/RocketClouds/Rocket Clouds.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@layer base {
  :root,
  .dark {
    /* ── Base palette ── */
    --background: #fdf8f3;
    --foreground: #262626;

    --card: #fdf8f3;
    --card-foreground: #262626;

    --popover: #fdf8f3;
    --popover-foreground: #262626;

    --primary: #262626;
    --primary-foreground: #fdf8f3;

    --secondary: #f5f0eb;
    --secondary-foreground: rgba(38, 38, 38, 0.60);

    --muted: #f5f0eb;
    --muted-foreground: rgba(38, 38, 38, 0.50);

    --accent: #e4a4bd;
    --accent-foreground: #262626;

    --destructive: #c9374d;
    --destructive-foreground: #ffffff;

    --border: rgba(38, 38, 38, 0.08);
    --input: rgba(38, 38, 38, 0.08);
    --ring: #e4a4bd;

    --radius: 24px;

    /* ── Sidebar ── */
    --sidebar-background: #f5f0eb;
    --sidebar-foreground: rgba(38, 38, 38, 0.60);
    --sidebar-primary: #262626;
    --sidebar-primary-foreground: #fdf8f3;
    --sidebar-accent: rgba(38, 38, 38, 0.05);
    --sidebar-accent-foreground: #262626;
    --sidebar-border: rgba(38, 38, 38, 0.06);
    --sidebar-ring: #e4a4bd;

    /* ── Design system tokens ── */
    --bg-root: #fdf8f3;
    --bg-secondary: #f5f0eb;
    --bg-surface-1: #fdf8f3;
    --bg-surface-2: #f5f0eb;
    --bg-surface-3: rgba(38, 38, 38, 0.06);
    --bg-inverse: #262626;

    --border-subtle: rgba(38, 38, 38, 0.04);
    --border-default: rgba(38, 38, 38, 0.05);
    --border-hover: rgba(38, 38, 38, 0.12);
    --border-focus: #e4a4bd;

    --text-primary: #262626;
    --text-secondary: rgba(38, 38, 38, 0.70);
    --text-tertiary: rgba(38, 38, 38, 0.40);
    --text-ghost: rgba(38, 38, 38, 0.22);
    --text-inverse: #fdf8f3;
    --text-label: rgba(38, 38, 38, 0.30);

    /* ── Accent ── */
    --accent-rose: #e4a4bd;
    --accent-rose-hover: #d48eaa;
    --accent-charcoal: #262626;

    /* ── Typography ── */
    --font-sans: 'League Spartan', system-ui, sans-serif;
    --font-brand: 'Rocket Clouds', cursive;

    /* ── Spacing ── */
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --space-8: 32px;
    --space-10: 40px;
    --space-12: 48px;
    --space-16: 64px;

    /* ── Motion ── */
    --ease-luxury: cubic-bezier(0.16, 1, 0.3, 1);
    --duration-reveal: 1s;
  }

  * {
    border-color: var(--border);
  }

  html {
    font-family: var(--font-sans);
  }

  body {
    background: var(--bg-root);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

/* ── Keyframes ── */
@keyframes reveal-up {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(-5%); }
  50% { transform: translateY(5%); }
}

@keyframes pulse-skeleton {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@layer utilities {
  /* ── Animations ── */
  .animate-reveal {
    animation: reveal-up var(--duration-reveal) var(--ease-luxury) both;
  }

  .animate-bounce-slow {
    animation: bounce-slow 4s ease-in-out infinite;
  }

  .animate-skeleton {
    animation: pulse-skeleton 2s ease infinite;
  }

  /* ── Font utilities ── */
  .font-brand {
    font-family: var(--font-brand);
  }

  /* ── Typography scale ── */
  .text-hero {
    font-size: 15vw;
    line-height: 0.8;
    font-weight: 900;
    letter-spacing: -0.04em;
  }

  .text-display {
    font-size: clamp(3rem, 8vw, 6rem);
    line-height: 0.8;
    font-weight: 800;
    letter-spacing: -0.04em;
  }

  .text-title {
    font-size: clamp(2rem, 5vw, 3.5rem);
    line-height: 0.85;
    font-weight: 700;
    letter-spacing: -0.03em;
  }

  .text-heading {
    font-size: 1.5rem;
    line-height: 1.1;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .text-subheading {
    font-size: 1.125rem;
    line-height: 1.2;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .text-body {
    font-size: 0.875rem;
    line-height: 1.7;
    font-weight: 400;
  }

  .text-caption {
    font-size: 0.8125rem;
    line-height: 1.4;
    font-weight: 500;
  }

  .text-label {
    font-size: 10px;
    line-height: 1.2;
    font-weight: 900;
    letter-spacing: 0.4em;
    text-transform: uppercase;
  }

  .text-micro {
    font-size: 9px;
    line-height: 1.2;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  /* ── Surfaces ── */
  .surface-card {
    background: var(--bg-surface-1);
    border: 1px solid var(--border-default);
    border-radius: 24px;
    transition: all var(--duration-reveal) var(--ease-luxury);
  }

  .surface-card:hover {
    background: var(--accent-rose);
    border-color: var(--accent-rose);
  }

  .surface-card:hover * {
    color: var(--accent-charcoal);
  }

  .surface-flat {
    background: var(--bg-surface-1);
    border: 1px solid var(--border-default);
  }

  .surface-secondary {
    background: var(--bg-secondary);
  }

  /* ── Accent badge ── */
  .badge-accent {
    background: var(--accent-rose);
    color: var(--accent-charcoal);
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  /* ── Image hover ── */
  .img-hover {
    transition: transform 0.8s var(--ease-luxury);
  }

  .img-hover:hover {
    transform: scale(1.08);
  }

  /* ── Pill button ── */
  .btn-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--accent-rose);
    color: var(--accent-charcoal);
    border-radius: 9999px;
    padding: 12px 32px;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    transition: all 0.3s var(--ease-luxury);
    border: none;
    cursor: pointer;
  }

  .btn-pill:hover {
    background: var(--accent-rose-hover);
    transform: translateY(-1px);
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: var(--accent-charcoal);
    border-radius: 9999px;
    padding: 12px 32px;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    transition: all 0.3s var(--ease-luxury);
    border: 1px solid var(--accent-charcoal);
    cursor: pointer;
  }

  .btn-secondary:hover {
    background: var(--accent-charcoal);
    color: var(--bg-root);
  }

  /* ── Glassmorphism ── */
  .glass {
    background: rgba(253, 248, 243, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(38, 38, 38, 0.05);
  }

  /* ── Section label with accent underline ── */
  .section-label-accent {
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.4em;
    text-transform: uppercase;
    color: var(--accent-rose);
    padding-bottom: 8px;
    border-bottom: 2px solid var(--accent-rose);
    display: inline-block;
  }

  /* ── Floating circle badge ── */
  .floating-badge {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    background: var(--accent-rose);
    color: var(--accent-charcoal);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    animation: bounce-slow 4s ease-in-out infinite;
  }
}

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(38, 38, 38, 0.10); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: rgba(228, 164, 189, 0.40); }

/* ── MapLibre popup overrides ── */
.maplibregl-popup-content {
  background: var(--bg-root) !important;
  border-radius: 16px !important;
  box-shadow: 0 8px 32px rgba(38, 38, 38, 0.08) !important;
  padding: 0 !important;
  border: 1px solid rgba(38, 38, 38, 0.05) !important;
}
.maplibregl-popup-tip {
  border-top-color: var(--bg-root) !important;
}
.maplibregl-popup-close-button {
  font-size: 16px;
  color: var(--text-tertiary);
  padding: 4px 8px;
}
.maplibregl-popup-close-button:hover {
  color: var(--accent-rose);
  background: transparent;
}
.maplibregl-ctrl-group {
  border-radius: 12px !important;
  box-shadow: 0 2px 8px rgba(38, 38, 38, 0.06) !important;
  border: 1px solid rgba(38, 38, 38, 0.05) !important;
}
.maplibregl-ctrl-group button {
  border-radius: 0 !important;
}

/* ── Range input ── */
.nomad-range {
  -webkit-appearance: none;
  appearance: none;
  height: 3px;
  background: rgba(38, 38, 38, 0.08);
  outline: none;
  cursor: pointer;
  border-radius: 2px;
}
.nomad-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--accent-rose);
  border: none;
  border-radius: 50%;
  cursor: pointer;
}
.nomad-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--accent-rose);
  border: none;
  border-radius: 50%;
  cursor: pointer;
}
```

**Step 2: Verify CSS syntax**

```bash
bun run build 2>&1 | head -20
```

Build may fail due to component references to old tokens. That's expected; we'll fix those in subsequent tasks.

**Step 3: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat: rewrite CSS design tokens for Super Travel system"
```

---

## Task 3: Update Tailwind Config

**Files:**
- Rewrite: `tailwind.config.ts`

**Step 1: Rewrite tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        brand: ['var(--font-brand)'],
      },
      borderRadius: {
        lg: '24px',
        md: '16px',
        sm: '12px',
        pill: '9999px',
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        rose: 'var(--accent-rose)',
        sidebar: {
          DEFAULT: 'var(--sidebar-background)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
      },
      transitionTimingFunction: {
        luxury: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [animate],
};

export default config;
```

**Step 2: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat: update Tailwind config for Super Travel design system"
```

---

## Task 4: Create RevealUp Hook and Footer Component

**Files:**
- Create: `src/hooks/useReveal.ts`
- Create: `src/components/footer.tsx`

**Step 1: Create the IntersectionObserver reveal hook**

File: `src/hooks/useReveal.ts`

```typescript
import { useEffect, useRef, useState } from 'react';

export function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}
```

**Step 2: Create the footer component**

File: `src/components/footer.tsx`

```tsx
import Link from 'next/link';

const navLinks = [
  { label: 'Browse', href: '/neighborhoods' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Favorites', href: '/favorites' },
  { label: 'Compare', href: '/compare' },
];

const socialLinks = [
  { label: 'GitHub', href: 'https://github.com' },
];

export function Footer() {
  return (
    <footer className="bg-[--bg-secondary] pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-12 gap-8">
          {/* Brand */}
          <div className="col-span-12 lg:col-span-5">
            <p className="font-brand text-2xl text-[--text-primary] mb-4">Nomadhood</p>
            <p className="text-body text-[--text-secondary] max-w-sm leading-relaxed">
              Neighborhood intelligence for digital nomads. Reviews, data, and maps from people who actually live there.
            </p>
          </div>

          {/* Nav */}
          <div className="col-span-4 lg:col-span-2 lg:col-start-7">
            <p className="section-label-accent mb-4">Navigate</p>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body text-[--text-secondary] hover:text-[--text-primary] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div className="col-span-4 lg:col-span-2">
            <p className="section-label-accent mb-4">Social</p>
            <ul className="space-y-3">
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body text-[--text-secondary] hover:text-[--text-primary] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div className="col-span-4 lg:col-span-2">
            <p className="section-label-accent mb-4">Info</p>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/auth/signin"
                  className="text-body text-[--text-secondary] hover:text-[--text-primary] transition-colors"
                >
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-6 border-t border-[rgba(38,38,38,0.08)] flex items-center justify-between">
          <p className="text-[9px] text-[rgba(38,38,38,0.30)] tracking-widest">
            &copy; {new Date().getFullYear()} NOMADHOOD
          </p>
          <p className="text-[9px] text-[rgba(38,38,38,0.30)] tracking-widest">
            ALL RIGHTS RESERVED
          </p>
        </div>
      </div>
    </footer>
  );
}
```

**Step 3: Commit**

```bash
git add src/hooks/useReveal.ts src/components/footer.tsx
git commit -m "feat: add reveal hook and footer component"
```

---

## Task 5: Update App Wrapper and Document

**Files:**
- Modify: `src/pages/_app.tsx`
- Modify: `src/pages/_document.tsx`

**Step 1: Update _app.tsx**

Remove AmbientOverlay import and rendering. Remove forced dark theme (the new system is light-only). Keep everything else.

Changes:
- Remove `import { AmbientOverlay }` line
- Remove `<AmbientOverlay />` JSX
- Change ThemeProvider forcedTheme from "dark" to "light"
- Change defaultTheme from "dark" to "light"

**Step 2: Update _document.tsx**

Remove the `className="dark"` from the Html element.

```typescript
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

**Step 3: Commit**

```bash
git add src/pages/_app.tsx src/pages/_document.tsx
git commit -m "feat: update app wrapper for light theme, remove ambient overlay"
```

---

## Task 6: Rewrite Navigation (Site Header)

**Files:**
- Rewrite: `src/components/site-header.tsx`

**Step 1: Rewrite site-header.tsx**

The new header is a fixed glassmorphism nav at 80px height. Left: brand. Center: menu items. Right: pill CTA + alert badge. This replaces the sidebar-trigger-based header.

```tsx
import { useSession } from 'next-auth/react';
import { BellIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { trpc } from '@/utils/trpc';

const menuItems = [
  { label: 'Browse', href: '/neighborhoods' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Favorites', href: '/favorites' },
  { label: 'Compare', href: '/compare' },
];

export function SiteHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const { data: unreadData } = trpc.news.getUnreadCount.useQuery(undefined, {
    enabled: !!session,
  });

  const unreadCount = unreadData?.count ?? 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass h-[80px]">
      <div className="mx-auto max-w-7xl h-full flex items-center justify-between px-6">
        {/* Left: Brand */}
        <Link href="/" className="font-brand text-lg text-[--text-primary] tracking-wide">
          NOMADHOOD
        </Link>

        {/* Center: Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-label tracking-[0.2em] transition-colors ${
                router.pathname.startsWith(item.href)
                  ? 'text-[--text-primary]'
                  : 'text-[--text-tertiary] hover:text-[--text-primary]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right: CTA + Alert */}
        <div className="flex items-center gap-4">
          {session && unreadCount > 0 && (
            <Link
              href="/dashboard"
              className="relative text-[--text-tertiary] hover:text-[--text-primary] transition-colors"
              title={`${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}`}
            >
              <BellIcon className="h-5 w-5" />
              <span className="absolute -top-1.5 -right-1.5 h-[18px] min-w-[18px] px-1 bg-[--accent-rose] text-[--accent-charcoal] text-[9px] font-bold leading-[18px] text-center rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </Link>
          )}
          {session ? (
            <Link href="/dashboard" className="btn-pill">
              Dashboard
            </Link>
          ) : (
            <Link href="/auth/signin" className="btn-pill">
              Get Started
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
```

Note: The old `SiteHeader` accepted a `title` prop and used `SidebarTrigger`. The new version is standalone. Dashboard/admin pages that use `DashboardLayout` will need to be updated in Task 7 to account for this. The new header is always present via a layout wrapper.

**Step 2: Commit**

```bash
git add src/components/site-header.tsx
git commit -m "feat: rewrite site header with glassmorphism nav"
```

---

## Task 7: Rewrite Layout Components

**Files:**
- Rewrite: `src/components/DefaultLayout.tsx`
- Modify: `src/components/dashboard-layout.tsx`
- Modify: `src/components/admin-layout.tsx`

**Step 1: Rewrite DefaultLayout.tsx**

The new default layout includes the fixed glassmorphism header, a top padding spacer (80px for the fixed nav), and the footer.

```tsx
import Head from 'next/head';
import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/site-header';
import { Footer } from '@/components/footer';

type DefaultLayoutProps = { children: ReactNode };

export const DefaultLayout = ({ children }: DefaultLayoutProps) => {
  return (
    <>
      <Head>
        <title>Nomadhood - Discover Your Perfect Neighborhood</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <SiteHeader />
      <main className="pt-[80px] min-h-screen">{children}</main>
      <Footer />
    </>
  );
};
```

**Step 2: Update dashboard-layout.tsx**

The dashboard layout no longer needs the sidebar/SidebarProvider pattern. Instead, it uses the DefaultLayout (which has the glassmorphism nav). The sidebar functionality can be replaced with a simpler left nav or removed entirely in favor of the top nav.

Rewrite to use the default layout with a simple content wrapper:

```tsx
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';

export function DashboardLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-[--bg-root]">
        <div className="h-8 w-32 bg-[--bg-surface-2] animate-skeleton rounded-lg" />
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-6">
      <div className="py-12">
        <h1 className="text-display mb-12">{title}</h1>
        {children}
      </div>
    </div>
  );
}
```

Note: Pages using DashboardLayout are wrapped in DefaultLayout via `_app.tsx` (the default getLayout). So the glassmorphism nav and footer are already present.

**Step 3: Update admin-layout.tsx**

Same pattern: use DashboardLayout wrapper, admin sub-nav gets the new styling.

```tsx
import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { UsersIcon, MapIcon, MessageSquareIcon, DatabaseIcon } from 'lucide-react';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';

const adminTabs = [
  { label: 'Users', href: '/admin/users', icon: UsersIcon },
  { label: 'Neighborhoods', href: '/admin/neighborhoods', icon: MapIcon },
  { label: 'Reviews', href: '/admin/reviews', icon: MessageSquareIcon },
  { label: 'Data', href: '/admin/data', icon: DatabaseIcon },
];

export function AdminLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { data: adminCheck, isLoading } = trpc.user.isAdmin.useQuery();

  if (isLoading) {
    return (
      <DashboardLayout title="Admin">
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </DashboardLayout>
    );
  }

  if (!adminCheck?.isAdmin) {
    router.push('/dashboard');
    return null;
  }

  return (
    <DashboardLayout title={title}>
      {/* Admin sub-nav */}
      <div className="flex gap-3 mb-8">
        {adminTabs.map((tab) => {
          const isActive = router.pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-pill text-label tracking-[0.2em] transition-all ${
                isActive
                  ? 'bg-[--accent-rose] text-[--accent-charcoal]'
                  : 'bg-[--bg-secondary] text-[--text-tertiary] hover:text-[--text-primary]'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </DashboardLayout>
  );
}
```

**Step 4: Commit**

```bash
git add src/components/DefaultLayout.tsx src/components/dashboard-layout.tsx src/components/admin-layout.tsx
git commit -m "feat: rewrite layout components for Super Travel design"
```

---

## Task 8: Update Base UI Components

**Files:**
- Modify: `src/components/star-rating.tsx`
- Modify: `src/components/favorite-button.tsx`
- Modify: `src/components/comparison-bar.tsx`
- Modify: `src/components/pagination.tsx`
- Modify: `src/components/rating-distribution-chart.tsx`
- Modify: `src/components/review-form.tsx`
- Modify: `src/components/section-cards.tsx`

**Step 1: Update star-rating.tsx**

Change star colors from `--vapor-pink` to `--accent-rose`, empty from purple to charcoal at 15%.

In `star-rating.tsx`, replace:
- `fill-[--vapor-pink] text-[--vapor-pink]` -> `fill-[--accent-rose] text-[--accent-rose]`
- `text-[rgba(120,80,200,0.15)]` or `text-black/15` -> `text-[rgba(38,38,38,0.15)]`

**Step 2: Update favorite-button.tsx**

Change heart colors from `--vapor-pink` to `--accent-rose`, empty from purple to charcoal.

- `fill-[--vapor-pink] text-[--vapor-pink]` -> `fill-[--accent-rose] text-[--accent-rose]`
- `text-[rgba(120,80,200,0.15)]` -> `text-[rgba(38,38,38,0.15)]`

**Step 3: Update comparison-bar.tsx**

- `bg-[--bg-inverse]` stays (it's charcoal now via `#262626`)
- `text-[--text-inverse]` stays
- Remove `surface-1` references, use clean backgrounds
- Item pills: `bg-white/10` stays fine

**Step 4: Update pagination.tsx**

- Replace `surface-1` with `surface-flat rounded-md`
- Active page: `bg-[--accent-rose] text-[--accent-charcoal]` instead of `bg-[--bg-inverse]`
- All interactive elements get `rounded-md` or `rounded-pill`
- Replace `text-[--text-ghost]` references -> keep same token (it's now charcoal-based)

**Step 5: Update rating-distribution-chart.tsx**

- `bg-[--vapor-pink]` -> `bg-[--accent-rose]`
- `bg-[rgba(120,80,200,0.06)]` -> `bg-[rgba(38,38,38,0.04)]`
- `bg-[rgba(120,80,200,0.12)]` -> `bg-[rgba(38,38,38,0.08)]`
- Add `rounded-sm` to bars

**Step 6: Update review-form.tsx**

- No structural changes needed, just verify button and input styles work with new tokens

**Step 7: Update section-cards.tsx**

Rewrite to use the services-grid pattern: 3-column grid with hover color shift.

```tsx
import { trpc } from '@/utils/trpc';
import { useReveal } from '@/hooks/useReveal';

export function SectionCards() {
  const { data: stats } = trpc.dashboard.getStats.useQuery();
  const { ref, isVisible } = useReveal();

  const chips = [
    { label: 'Neighborhoods', value: stats?.neighborhoodCount },
    { label: 'Users', value: stats?.userCount },
    { label: 'Reviews', value: stats?.reviewCount },
    { label: 'Favorites', value: stats?.favoriteCount },
  ];

  return (
    <div
      ref={ref}
      className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${
        isVisible ? 'animate-reveal' : 'opacity-0'
      }`}
    >
      {chips.map((chip) => (
        <div
          key={chip.label}
          className="surface-card p-8 group cursor-default"
        >
          <p className="text-label text-[--text-ghost] group-hover:text-[--accent-charcoal] mb-3 transition-colors">
            {chip.label}
          </p>
          <p className="text-display tabular-nums text-[--text-primary] group-hover:text-[--accent-charcoal] transition-colors">
            {chip.value ?? '\u2014'}
          </p>
        </div>
      ))}
    </div>
  );
}
```

**Step 8: Commit**

```bash
git add src/components/star-rating.tsx src/components/favorite-button.tsx src/components/comparison-bar.tsx src/components/pagination.tsx src/components/rating-distribution-chart.tsx src/components/review-form.tsx src/components/section-cards.tsx
git commit -m "feat: update base UI components for Super Travel theme"
```

---

## Task 9: Rewrite Neighborhood Card

**Files:**
- Rewrite: `src/components/neighborhood-card.tsx`

**Step 1: Rewrite neighborhood-card.tsx**

New card: 3:4 aspect ratio image with 16px radius, category label in `#e4a4bd`, 3xl title, hover shows centered overlay circle. Card has 24px radius, hover shifts to rose.

```tsx
import Link from 'next/link';
import { StarIcon, GitCompareArrowsIcon } from 'lucide-react';

import { FavoriteButton } from '@/components/favorite-button';
import { useComparison } from '@/contexts/comparison-context';

type NeighborhoodCardProps = {
  id: string;
  name: string;
  city: string;
  state: string;
  description: string | null;
  _count: {
    reviews: number;
    favorites: number;
  };
};

export function NeighborhoodCard({
  neighborhood,
  nomadScore,
  imageUrl,
  imageAlt,
  imageSource,
}: {
  neighborhood: NeighborhoodCardProps;
  nomadScore?: number;
  imageUrl?: string;
  imageAlt?: string;
  imageSource?: string;
}) {
  const { add, remove, has, isFull } = useComparison();
  const isComparing = has(neighborhood.id);

  return (
    <Link href={`/neighborhoods/${neighborhood.id}`} className="block group">
      <div className="relative">
        {/* Image */}
        {imageUrl && (
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg mb-4">
            <img
              src={imageUrl}
              alt={imageAlt ?? `${neighborhood.name} neighborhood`}
              loading="lazy"
              className="h-full w-full object-cover img-hover"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="h-24 w-24 rounded-full bg-[--accent-charcoal] flex items-center justify-center">
                <span className="text-label text-[--text-inverse] tracking-[0.3em]">VIEW</span>
              </div>
            </div>
            {/* Source attribution */}
            {imageSource && (
              <span className="absolute bottom-3 left-3 text-[9px] tracking-widest uppercase text-white/70 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                {imageSource}
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isComparing) {
                remove(neighborhood.id);
              } else if (!isFull) {
                add({ id: neighborhood.id, name: neighborhood.name });
              }
            }}
            disabled={!isComparing && isFull}
            className={`p-2 rounded-full backdrop-blur-sm transition-all ${
              isComparing
                ? 'bg-[--accent-rose] text-[--accent-charcoal]'
                : 'bg-white/60 text-[--text-tertiary] hover:bg-white/80 disabled:opacity-30'
            }`}
            title={isComparing ? 'Remove from comparison' : 'Add to comparison'}
          >
            <GitCompareArrowsIcon className="h-3.5 w-3.5" />
          </button>
          <FavoriteButton neighborhoodId={neighborhood.id} />
        </div>

        {/* Score badge */}
        {nomadScore != null && nomadScore > 0 && (
          <div className="absolute top-3 left-3 badge-accent px-3 py-1 z-10">
            {nomadScore}
          </div>
        )}

        {/* Content */}
        <div>
          <p className="text-label text-[--accent-rose] mb-2">
            {neighborhood.city}, {neighborhood.state}
          </p>
          <p className="text-heading text-[--text-primary] mb-2">
            {neighborhood.name}
          </p>

          {neighborhood.description && (
            <p className="text-body text-[--text-secondary] line-clamp-2 mb-3">
              {neighborhood.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-micro text-[--text-ghost]">
            <span className="flex items-center gap-1">
              <StarIcon className="h-3 w-3 fill-[--accent-rose] text-[--accent-rose]" />
              {neighborhood._count.reviews} review{neighborhood._count.reviews !== 1 ? 's' : ''}
            </span>
            <span>{neighborhood._count.favorites} saved</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/neighborhood-card.tsx
git commit -m "feat: rewrite neighborhood card with editorial style"
```

---

## Task 10: Rewrite Landing Page

**Files:**
- Rewrite: `src/pages/index.tsx`

**Step 1: Rewrite index.tsx**

Full hero with massive headline, services grid, staggered neighborhood gallery.

```tsx
import Link from 'next/link';
import { MapPinIcon, StarIcon, HeartIcon, BarChart2Icon, ArrowDownIcon } from 'lucide-react';
import { trpc } from '../utils/trpc';
import { useReveal } from '@/hooks/useReveal';
import { NeighborhoodCard } from '@/components/neighborhood-card';
import type { NextPageWithLayout } from './_app';

const services = [
  { icon: MapPinIcon, title: 'Interactive Map', desc: 'Browse neighborhoods on a live map with markers, clusters, and popup detail cards.' },
  { icon: StarIcon, title: 'Rated Reviews', desc: 'Read honest reviews with multi-dimension ratings from people who actually lived there.' },
  { icon: BarChart2Icon, title: 'Nomad Score', desc: 'Data-backed composite scores ranking neighborhoods by walkability, safety, cost, and more.' },
];

function HeroSection() {
  const { data: me, isLoading: meLoading } = trpc.user.me.useQuery();

  return (
    <section className="min-h-screen flex items-center relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-12 gap-8 items-center w-full">
        {/* Left: Headline */}
        <div className="col-span-12 lg:col-span-7">
          <h1 className="text-hero text-[--text-primary] mb-8">
            Know the<br />
            <em className="not-italic lowercase text-[--accent-rose]">neighborhood</em><br />
            before you<br />
            move.
          </h1>
          <p className="text-body text-[--text-secondary] max-w-md mb-8 text-xl leading-relaxed">
            Reviews, ratings, and maps from people who actually live there.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/neighborhoods" className="btn-pill">
              Browse Neighborhoods
            </Link>
            {!meLoading && !me && (
              <Link href="/auth/signin" className="btn-secondary">
                Sign In
              </Link>
            )}
          </div>
          {/* Arrow CTA */}
          <div className="mt-16 flex items-center gap-3 group cursor-pointer">
            <span className="text-micro text-[--text-tertiary] border-b-2 border-[--accent-rose] pb-1">
              SCROLL TO EXPLORE
            </span>
            <ArrowDownIcon className="h-4 w-4 text-[--accent-rose] group-hover:translate-y-1 transition-transform" />
          </div>
        </div>

        {/* Right: Image card */}
        <div className="col-span-12 lg:col-span-5 relative">
          <div className="rounded-3xl overflow-hidden aspect-[3/4] bg-[--bg-secondary]">
            <img
              src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=800&fit=crop"
              alt="City neighborhood"
              className="h-full w-full object-cover"
            />
          </div>
          {/* Floating badge */}
          <div className="absolute -bottom-6 -left-6 floating-badge">
            <span className="text-3xl italic font-light">01</span>
            <span className="text-[8px] font-black tracking-[0.4em]">NOMADHOOD</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  const { ref, isVisible } = useReveal();

  return (
    <section ref={ref} className="bg-[--bg-secondary] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2
          className={`text-display mb-16 ${
            isVisible ? 'animate-reveal' : 'opacity-0'
          }`}
        >
          What we offer
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-[rgba(38,38,38,0.06)]">
          {services.map((svc, i) => (
            <div
              key={svc.title}
              className={`p-10 group cursor-default transition-all duration-700 ease-luxury hover:bg-[--accent-rose] ${
                isVisible ? 'animate-reveal' : 'opacity-0'
              }`}
              style={{ animationDelay: `${200 + i * 100}ms` }}
            >
              <svc.icon className="h-8 w-8 text-[--accent-rose] group-hover:text-[--accent-charcoal] mb-6 transition-colors" />
              <h3 className="text-subheading text-[--text-primary] group-hover:text-[--accent-charcoal] mb-3 transition-colors">
                {svc.title}
              </h3>
              <p className="text-body text-[--text-secondary] group-hover:text-[--accent-charcoal] leading-relaxed transition-colors">
                {svc.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedSection() {
  const { data: recent } = trpc.neighborhoods.list.useQuery({ limit: 6, sortBy: 'most_reviews' });
  const neighborhoodIds = recent?.neighborhoods.map((n) => n.id) ?? [];
  const { data: imageMap } = trpc.data.getImages.useQuery(
    { neighborhoodIds },
    { enabled: neighborhoodIds.length > 0 },
  );
  const { ref, isVisible } = useReveal();

  if (!recent || recent.neighborhoods.length === 0) return null;

  return (
    <section ref={ref} className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between mb-16">
          <h2
            className={`text-display ${isVisible ? 'animate-reveal' : 'opacity-0'}`}
          >
            Featured
          </h2>
          <Link
            href="/neighborhoods"
            className={`text-micro text-[--text-tertiary] hover:text-[--text-primary] transition-colors border-b-2 border-[--accent-rose] pb-1 ${
              isVisible ? 'animate-reveal' : 'opacity-0'
            }`}
            style={{ animationDelay: '200ms' }}
          >
            VIEW ALL
          </Link>
        </div>

        {/* Staggered 2-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
          {recent.neighborhoods.map((n, i) => (
            <div
              key={n.id}
              className={`${i % 2 === 1 ? 'md:mt-[100px]' : ''} mb-12 ${
                isVisible ? 'animate-reveal' : 'opacity-0'
              }`}
              style={{ animationDelay: `${300 + i * 100}ms` }}
            >
              <NeighborhoodCard
                neighborhood={n}
                nomadScore={n.nomadScore}
                imageUrl={imageMap?.[n.id]?.[0]?.thumbUrl ?? imageMap?.[n.id]?.[0]?.imageUrl}
                imageAlt={imageMap?.[n.id]?.[0]?.altText ?? undefined}
                imageSource={imageMap?.[n.id]?.[0]?.source}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const { data: stats } = trpc.dashboard.getStats.useQuery();
  const { ref, isVisible } = useReveal();

  if (!stats) return null;

  const items = [
    { value: stats.neighborhoodCount, label: 'Neighborhoods' },
    { value: stats.reviewCount, label: 'Reviews' },
    { value: stats.userCount, label: 'Members' },
  ];

  return (
    <section ref={ref} className="bg-[--bg-secondary] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex justify-center gap-24">
          {items.map((item, i) => (
            <div
              key={item.label}
              className={`text-center ${isVisible ? 'animate-reveal' : 'opacity-0'}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <p className="text-display tabular-nums text-[--text-primary]">{item.value}</p>
              <p className="text-label text-[--text-ghost] mt-2">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const IndexPage: NextPageWithLayout = () => {
  return (
    <div>
      <HeroSection />
      <ServicesSection />
      <FeaturedSection />
      <StatsSection />
    </div>
  );
};

export default IndexPage;
```

**Step 2: Commit**

```bash
git add src/pages/index.tsx
git commit -m "feat: rewrite landing page with hero, services grid, staggered gallery"
```

---

## Task 11: Rewrite Browse Page

**Files:**
- Rewrite: `src/pages/neighborhoods/index.tsx`

**Step 1: Rewrite browse page**

Replace split-view with staggered gallery. Keep sort/filter/search/pagination but restyle. Map is a full-width togglable section.

Key changes:
- Replace `surface-1` with `surface-card` / `surface-flat rounded-lg`
- Replace all purple-tinted colors with new tokens
- Staggered 2-column grid for neighborhood cards (even items offset 100px)
- Sort/filter controls: pill-shaped selectors with rounded corners
- Map section: full-width above gallery, toggleable
- Use `animate-reveal` instead of `animate-fade-up`
- Use `useReveal` for scroll-triggered sections
- Replace `--vapor-purple`, `--vapor-pink` with `--accent-rose`
- Replace `rgba(120,80,200,...)` with `rgba(38,38,38,...)`

The page keeps all existing tRPC queries and state management. Only the JSX/styling changes.

**Step 2: Commit**

```bash
git add src/pages/neighborhoods/index.tsx
git commit -m "feat: rewrite browse page with staggered gallery layout"
```

---

## Task 12: Rewrite Detail Page

**Files:**
- Rewrite: `src/pages/neighborhoods/[id].tsx`
- Modify: `src/components/neighborhood-pulse.tsx`
- Modify: `src/components/neighborhood-data-panel.tsx`
- Modify: `src/components/similar-neighborhoods.tsx`

**Step 1: Rewrite detail page**

Key changes:
- Editorial hero: full-width image with massive overlay name text
- Stat pills: horizontal bar with `--accent-rose` accents, rounded-pill
- Score cards: clean sections with large numbers, rounded-lg cards
- Replace all purple-tinted colors with warm palette
- Replace `surface-1` with `surface-card` or `surface-flat rounded-lg`
- Replace `bg-vapor` score badges with `badge-accent`
- Replace `animate-fade-up` with `animate-reveal`
- Stars: `--accent-rose` fills
- Section labels: `--accent-rose` color with `text-label`

**Step 2: Update neighborhood-pulse.tsx**

- Replace `bg-[--vapor-pink]` -> `bg-[--accent-rose]`
- Replace `bg-[--vapor-purple]` -> `bg-[--accent-rose]` (lighter)
- Replace `bg-vapor text-white` -> `badge-accent`
- Replace `rgba(120,80,200,...)` -> `rgba(38,38,38,...)`
- Replace `animate-fade-up` -> `animate-reveal`

**Step 3: Update neighborhood-data-panel.tsx**

- Replace `--vapor-pink` -> `--accent-rose`
- Replace `--vapor-purple` -> `--accent-rose`
- Replace `rgba(120,80,200,...)` -> `rgba(38,38,38,...)`
- Add `rounded-lg` to card wrappers

**Step 4: Update similar-neighborhoods.tsx**

- Replace `animate-fade-up` -> `animate-reveal`
- Staggered layout for the grid (even items offset)

**Step 5: Commit**

```bash
git add src/pages/neighborhoods/[id].tsx src/components/neighborhood-pulse.tsx src/components/neighborhood-data-panel.tsx src/components/similar-neighborhoods.tsx
git commit -m "feat: rewrite detail page with editorial hero layout"
```

---

## Task 13: Rewrite Dashboard Page and Components

**Files:**
- Rewrite: `src/pages/dashboard.tsx`
- Modify: `src/components/dashboard/risk-alerts.tsx`
- Modify: `src/components/dashboard/news-trending.tsx`
- Modify: `src/components/dashboard/activity-feed.tsx`
- Modify: `src/components/dashboard/review-trend-chart.tsx`
- Modify: `src/components/dashboard/top-neighborhoods-chart.tsx`

**Step 1: Rewrite dashboard.tsx**

```tsx
import { DashboardLayout } from '@/components/dashboard-layout';
import { SectionCards } from '@/components/section-cards';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { TopNeighborhoodsChart } from '@/components/dashboard/top-neighborhoods-chart';
import { ReviewTrendChart } from '@/components/dashboard/review-trend-chart';
import { RiskAlerts } from '@/components/dashboard/risk-alerts';
import { NewsTrending } from '@/components/dashboard/news-trending';
import { useReveal } from '@/hooks/useReveal';

function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, isVisible } = useReveal();
  return (
    <div
      ref={ref}
      className={isVisible ? 'animate-reveal' : 'opacity-0'}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-12">
        {/* Risk Alerts */}
        <RevealSection>
          <RiskAlerts />
        </RevealSection>

        {/* Stat Cards */}
        <SectionCards />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
          <RevealSection delay={100}>
            <div className="surface-flat rounded-lg p-8">
              <p className="text-label text-[--text-ghost] mb-6">Review Activity</p>
              <ReviewTrendChart />
            </div>
          </RevealSection>
          <RevealSection delay={200}>
            <div className="surface-flat rounded-lg p-8">
              <p className="text-label text-[--text-ghost] mb-6">Top Neighborhoods</p>
              <TopNeighborhoodsChart />
            </div>
          </RevealSection>
        </div>

        {/* Activity Feed */}
        <RevealSection delay={300}>
          <div className="surface-flat rounded-lg p-8">
            <p className="text-label text-[--text-ghost] mb-6">Recent Activity</p>
            <ActivityFeed />
          </div>
        </RevealSection>

        {/* News Trending */}
        <RevealSection delay={400}>
          <NewsTrending />
        </RevealSection>
      </div>
    </DashboardLayout>
  );
}
```

**Step 2: Update risk-alerts.tsx**

- Replace `bg-[--vapor-pink]` -> `bg-[--accent-rose]`
- Replace `rgba(120,80,200,...)` -> `rgba(38,38,38,...)`
- Replace `surface-1` -> `surface-flat rounded-lg`
- Replace `bg-[--bg-surface-2]` -> `bg-[--bg-secondary]`
- Replace `text-[--vapor-purple]` -> `text-[--accent-rose]`
- Replace `animate-fade-up` -> `animate-reveal`

**Step 3: Update news-trending.tsx**

- Replace `bg-[--vapor-pink]` -> `bg-[--accent-rose]`
- Replace `rgba(120,80,200,...)` -> `rgba(38,38,38,...)`
- Replace `surface-1` -> `surface-flat rounded-lg`
- Replace `animate-fade-up` -> `animate-reveal`

**Step 4: Update activity-feed.tsx**

- Replace `rgba(120,80,200,...)` -> `rgba(38,38,38,...)`
- Replace `bg-[--bg-surface-1]` -> `bg-[--bg-secondary]`
- Replace `bg-[--bg-surface-2]` -> `bg-[--bg-secondary]`
- Replace `animate-fade-up` -> `animate-reveal`
- Add `rounded-full` to avatar (already present but verify)

**Step 5: Update review-trend-chart.tsx**

- Replace pink accent in recharts config: `#FF6B9D` -> `#e4a4bd`
- Replace purple references -> charcoal at low opacity

**Step 6: Update top-neighborhoods-chart.tsx**

- Replace `--vapor-pink` -> `--accent-rose`
- Replace `rgba(120,80,200,...)` -> `rgba(38,38,38,...)`

**Step 7: Commit**

```bash
git add src/pages/dashboard.tsx src/components/dashboard/risk-alerts.tsx src/components/dashboard/news-trending.tsx src/components/dashboard/activity-feed.tsx src/components/dashboard/review-trend-chart.tsx src/components/dashboard/top-neighborhoods-chart.tsx
git commit -m "feat: rewrite dashboard with Super Travel design"
```

---

## Task 14: Rewrite Compare, Favorites, Auth, Profile Pages

**Files:**
- Modify: `src/pages/compare.tsx`
- Modify: `src/pages/favorites.tsx`
- Rewrite: `src/pages/auth/signin.tsx`
- Rewrite: `src/pages/auth/signup.tsx`
- Modify: `src/components/auth/SignInForm.tsx`
- Modify: `src/components/auth/SignUpForm.tsx`
- Modify: `src/pages/profile.tsx`
- Modify: `src/pages/users/[id].tsx`
- Modify: `src/pages/404.tsx`

**Step 1: Update compare.tsx**

- Replace `surface-1` with `surface-flat rounded-lg`
- Replace `rgba(120,80,200,...)` -> `rgba(38,38,38,...)`
- Replace `animate-fade-up` -> `animate-reveal`
- Add `rounded-lg` to image elements
- Score badges: `badge-accent`

**Step 2: Update favorites.tsx**

- Replace `surface-1` with `surface-flat rounded-lg`
- Replace `rgba(120,80,200,...)` -> `rgba(38,38,38,...)`
- Replace `bg-[--bg-surface-2]` -> `bg-[--bg-secondary]`
- Replace `animate-fade-up` -> `animate-reveal`
- Floating position numbers using `floating-badge` pattern (smaller, 40px circles)
- CTA button: `btn-pill`

**Step 3: Rewrite auth/signin.tsx**

```tsx
import { SignInForm } from '@/components/auth/SignInForm';

export default function SignIn() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="text-display mb-4">Sign In</h1>
        <p className="text-body text-[--text-secondary] mb-12">
          Sign in with GitHub to continue.
        </p>
        <div className="surface-flat rounded-lg p-8">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Rewrite auth/signup.tsx**

Same pattern as signin, massive headline, card wrapper with rounded-lg.

**Step 5: Update SignInForm.tsx and SignUpForm.tsx**

- Replace button styles with `btn-pill` for primary, `btn-secondary` for secondary
- Replace `rgba(120,80,200,...)` -> `rgba(38,38,38,...)`
- Add `rounded-lg` to inputs (via global token now)

**Step 6: Update profile.tsx**

- Replace `surface-1` -> `surface-flat rounded-lg`
- Replace `rgba(120,80,200,...)` -> `rgba(38,38,38,...)`
- Replace `--vapor-pink` -> `--accent-rose`
- Replace `animate-fade-up` -> `animate-reveal`
- Replace `text-heading font-light` -> `text-heading`

**Step 7: Update users/[id].tsx**

Same token replacements as profile.tsx.

**Step 8: Update 404.tsx**

```tsx
import Link from 'next/link';

export default function Custom404() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center gap-6">
      <h1 className="text-hero">404</h1>
      <p className="text-body text-[--text-secondary]">Page not found.</p>
      <Link href="/" className="btn-pill">
        Go Home
      </Link>
    </div>
  );
}
```

**Step 9: Commit**

```bash
git add src/pages/compare.tsx src/pages/favorites.tsx src/pages/auth/signin.tsx src/pages/auth/signup.tsx src/components/auth/SignInForm.tsx src/components/auth/SignUpForm.tsx src/pages/profile.tsx src/pages/users/[id].tsx src/pages/404.tsx
git commit -m "feat: update all remaining pages for Super Travel design"
```

---

## Task 15: Update Map and Remaining Components

**Files:**
- Modify: `src/components/neighborhood-map.tsx`
- Delete or empty: `src/components/ambient-overlay.tsx`
- Modify: `src/components/app-sidebar.tsx`
- Modify: `src/components/nav-main.tsx`
- Modify: `src/components/nav-user.tsx`
- Modify: `src/components/nav-secondary.tsx`

**Step 1: Update neighborhood-map.tsx**

- Marker colors: replace pink-purple-cyan gradient interpolation with solid `#e4a4bd` fills
- Popup styling is handled by globals.css overrides (already updated in Task 2)
- Boundary polygon fill: `rgba(228, 164, 189, 0.12)` (rose tint)
- Boundary polygon stroke: `#e4a4bd`

**Step 2: Empty ambient-overlay.tsx**

```tsx
export function AmbientOverlay() {
  return null;
}
```

The component is still imported in `_app.tsx` (we removed the JSX in Task 5 but need to keep the export to avoid build errors). Alternatively, remove the import entirely from `_app.tsx` if done in Task 5.

**Step 3: Update sidebar components**

The sidebar is still used internally by shadcn/ui components. Update colors:
- Replace purple-tinted backgrounds with warm palette
- Replace `--vapor-purple` -> `--accent-rose` in hover states
- Sidebar nav items: `rounded-lg` on hover

**Step 4: Commit**

```bash
git add src/components/neighborhood-map.tsx src/components/ambient-overlay.tsx src/components/app-sidebar.tsx src/components/nav-main.tsx src/components/nav-user.tsx src/components/nav-secondary.tsx
git commit -m "feat: update map, sidebar, and remove ambient overlay"
```

---

## Task 16: Update Admin Pages

**Files:**
- Modify: `src/pages/admin/users.tsx`
- Modify: `src/pages/admin/neighborhoods.tsx`
- Modify: `src/pages/admin/reviews.tsx`
- Modify: `src/pages/admin/data.tsx`

**Step 1: Update all admin pages**

Light touch: these pages keep their table-based layouts but adopt new styling:
- Replace `surface-1` -> `surface-flat rounded-lg`
- Replace `rgba(120,80,200,...)` -> `rgba(38,38,38,...)`
- Replace `--vapor-pink`, `--vapor-purple` -> `--accent-rose`
- Replace `bg-[--bg-inverse]` button -> `btn-pill`
- Replace `animate-fade-up` -> `animate-reveal`
- Tables: add `rounded-lg overflow-hidden` to wrapper
- Table rows: hover `bg-[--bg-secondary]`

**Step 2: Commit**

```bash
git add src/pages/admin/
git commit -m "feat: update admin pages for Super Travel theme"
```

---

## Task 17: Update CLAUDE.md Design Context

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Rewrite the Design Context section**

Replace the entire `## Design Context` section in CLAUDE.md with the Super Travel design system rules. Keep all other sections (Git Commits, Push Pipeline) unchanged.

Key sections to update:
- **Aesthetic Direction**: Warm off-white base, dusty rose accent
- **Design Principles**: Updated for Super Travel (rounded corners, clean surfaces, bold typography)
- **Accent Palette**: Single `--accent-rose: #e4a4bd`
- **Base Color Tokens**: Warm off-white palette
- **Component Rules**: Cards with 24px radius, pill buttons, rose accent everywhere
- **Typography**: League Spartan primary, Rocket Clouds brand only
- **Motion**: cubic-bezier(0.16, 1, 0.3, 1), scroll reveals

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md design context for Super Travel system"
```

---

## Task 18: Build Verification and Cleanup

**Step 1: Run type check**

```bash
bun run type-check
```

Fix any TypeScript errors from removed/renamed tokens or components.

**Step 2: Run build**

```bash
bun run build
```

Fix any build errors. Common issues:
- References to old CSS tokens (`--vapor-pink`, `--vapor-purple`, `--bg-surface-1` as old values)
- References to old utility classes (`surface-1`, `surface-2`, `bg-vapor`, `text-vapor`, `glow-hover`)
- Removed components still imported
- SidebarTrigger imports in components that no longer use it

**Step 3: Run lint**

```bash
bun run lint
```

Fix any linting errors.

**Step 4: Visual verification**

Start dev server and verify each page:

```bash
bun dev
```

Check:
- Landing page: hero, services grid, staggered gallery, stats, footer
- Browse: staggered gallery, sort/filter, map toggle
- Detail: editorial hero, stat bar, scores, pulse, reviews
- Dashboard: risk alerts, stat cards, charts, activity feed, trending
- Compare: side-by-side cards
- Favorites: drag-drop list with new styling
- Auth: signin/signup with massive headline
- Profile: editorial layout
- Admin: tables with new theme
- 404: massive "404" text
- Navigation: glassmorphism, centered menu, pill CTA
- Footer: brand, nav columns, bottom bar

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build errors and visual polish"
```

---

## Task 19: Update Memory and Documentation

**Files:**
- Modify: `/Users/ricardozavala/.claude/projects/-Users-ricardozavala-WebstormProjects-nomadhood/memory/MEMORY.md`

**Step 1: Update MEMORY.md**

Update the Design Theme section to reflect the Super Travel system:
- Colors: warm off-white `#fdf8f3`, dusty rose `#e4a4bd`, charcoal `#262626`
- Typography: League Spartan (UI), Rocket Clouds (branding only)
- Rounded corners: 24px cards, 16px images, pill CTAs
- Clean surfaces, no inset shadows
- Scroll-triggered reveals with cubic-bezier(0.16, 1, 0.3, 1)

**Step 2: Commit (not applicable for memory files)**

Memory files are not committed to git.

---

## Files Summary

| File | Action | Task |
|------|--------|------|
| `public/LeagueSpartan/` | Create | 1 |
| `src/styles/globals.css` | Rewrite | 2 |
| `tailwind.config.ts` | Rewrite | 3 |
| `src/hooks/useReveal.ts` | Create | 4 |
| `src/components/footer.tsx` | Create | 4 |
| `src/pages/_app.tsx` | Modify | 5 |
| `src/pages/_document.tsx` | Modify | 5 |
| `src/components/site-header.tsx` | Rewrite | 6 |
| `src/components/DefaultLayout.tsx` | Rewrite | 7 |
| `src/components/dashboard-layout.tsx` | Rewrite | 7 |
| `src/components/admin-layout.tsx` | Rewrite | 7 |
| `src/components/star-rating.tsx` | Modify | 8 |
| `src/components/favorite-button.tsx` | Modify | 8 |
| `src/components/comparison-bar.tsx` | Modify | 8 |
| `src/components/pagination.tsx` | Modify | 8 |
| `src/components/rating-distribution-chart.tsx` | Modify | 8 |
| `src/components/review-form.tsx` | Modify | 8 |
| `src/components/section-cards.tsx` | Rewrite | 8 |
| `src/components/neighborhood-card.tsx` | Rewrite | 9 |
| `src/pages/index.tsx` | Rewrite | 10 |
| `src/pages/neighborhoods/index.tsx` | Rewrite | 11 |
| `src/pages/neighborhoods/[id].tsx` | Rewrite | 12 |
| `src/components/neighborhood-pulse.tsx` | Modify | 12 |
| `src/components/neighborhood-data-panel.tsx` | Modify | 12 |
| `src/components/similar-neighborhoods.tsx` | Modify | 12 |
| `src/pages/dashboard.tsx` | Rewrite | 13 |
| `src/components/dashboard/risk-alerts.tsx` | Modify | 13 |
| `src/components/dashboard/news-trending.tsx` | Modify | 13 |
| `src/components/dashboard/activity-feed.tsx` | Modify | 13 |
| `src/components/dashboard/review-trend-chart.tsx` | Modify | 13 |
| `src/components/dashboard/top-neighborhoods-chart.tsx` | Modify | 13 |
| `src/pages/compare.tsx` | Modify | 14 |
| `src/pages/favorites.tsx` | Modify | 14 |
| `src/pages/auth/signin.tsx` | Rewrite | 14 |
| `src/pages/auth/signup.tsx` | Rewrite | 14 |
| `src/components/auth/SignInForm.tsx` | Modify | 14 |
| `src/components/auth/SignUpForm.tsx` | Modify | 14 |
| `src/pages/profile.tsx` | Modify | 14 |
| `src/pages/users/[id].tsx` | Modify | 14 |
| `src/pages/404.tsx` | Rewrite | 14 |
| `src/components/neighborhood-map.tsx` | Modify | 15 |
| `src/components/ambient-overlay.tsx` | Modify | 15 |
| `src/components/app-sidebar.tsx` | Modify | 15 |
| `src/pages/admin/*.tsx` (4 files) | Modify | 16 |
| `CLAUDE.md` | Modify | 17 |
| MEMORY.md | Modify | 19 |

**Total: ~48 files across 19 tasks**

## Verification

1. `bun run type-check` passes
2. `bun run build` passes
3. `bun run lint` passes (or only pre-existing warnings)
4. Visual check of all pages against Super Travel spec
5. All tRPC queries still work (no data layer changes)
6. Scroll reveal animations trigger at 0.15 threshold
7. Glassmorphism nav blurs on scroll
8. Cards hover to dusty rose
9. Images scale on hover
10. League Spartan renders for all UI text
11. Rocket Clouds renders for "Nomadhood" wordmark only

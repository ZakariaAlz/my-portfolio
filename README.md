# Zakaria Alizouaoui — Portfolio

A single-page portfolio for **Zakaria "Zack" Alizouaoui** — Data Engineer & AI Specialist based in Algiers. It's built as a piece of engineering in its own right: hand-written WebGL and Canvas, scroll-choreographed reveals, and a strict design system, with motion that degrades gracefully and respects `prefers-reduced-motion`.

> Career arc the site is built around: **Software → Data → AI / Automation.**

---

## Highlights

- **Hand-rolled WebGL hero** — an iridescent fluid shader (raw `three.js`, no React-Three-Fiber) that reacts to cursor and scroll.
- **Orchestrated scroll reveals** — a single `IntersectionObserver` drives a soft blur-in fade-up site-wide, with composed, section-specific choreography on top (masked heading reveals, drawn pipeline rails, count-up stats).
- **Cinematic set-pieces** — a pinned "How I work" scroll story, a live-typing code window, a tabbed architecture node-flow on `<canvas>`, a glassy "pebble" career timeline, and a global cursor ribbon.
- **Robust by design** — reveals are set up first and independently with a 2.5 s failsafe, so content can never get stuck hidden if WebGL or smooth-scroll fail to initialize.
- **Accessible & calm** — every animation is gated behind `prefers-reduced-motion`; the cursor ribbon and magnetic buttons only activate for fine pointers.

---

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | **Next.js 16** (App Router, Turbopack) |
| Runtime / PM | **Bun** |
| Language | **TypeScript** (strict) |
| Styling | **Tailwind CSS v4** (`@import "tailwindcss"`) + a hand-authored token layer in `globals.css` |
| 3D / WebGL | **three.js** (imperative, inside `useEffect` — not R3F) |
| Motion | **GSAP** (+ ScrollTrigger), **Framer Motion**, native Canvas/CSS |
| Smooth scroll | **@studio-freight/lenis** |
| Fonts | Bricolage Grotesque · Hanken Grotesk · JetBrains Mono · Caveat (via `next/font`) |

---

## Getting started

Requires [Bun](https://bun.sh). This project does **not** use npm/pnpm.

```bash
bun install        # install dependencies
bun run dev        # dev server → http://localhost:3001 (3000 is usually taken)
bun run build      # production build (keep this green)
bun run start      # serve the production build
bun run lint       # eslint
```

> **Heads up:** `dev` and `build` share the `.next` directory. Don't run `bun run build` while `bun run dev` is live — the build clobbers dev's chunks and serves stale CSS. For a quick mid-work type check use `bunx tsc --noEmit`. If CSS ever looks stale, stop dev, `rm -rf .next`, and restart.

---

## Project structure

```
src/
├─ app/
│  ├─ page.tsx          # the entire single page (one "use client" component)
│  ├─ layout.tsx        # fonts + the window.ICONS <Script> (must live in <body>)
│  └─ globals.css       # design tokens + every component's styles & keyframes
├─ components/
│  ├─ LiquidHero.tsx        # full-screen WebGL iridescent fluid (hero background)
│  ├─ ArchitectureFlow.tsx  # tabbed node-flow board, Canvas bezier links + pulses
│  ├─ CodeWindow.tsx        # macOS code window that live-types on scroll-in
│  ├─ HowIWork.tsx          # pinned scroll story (position: sticky, not GSAP pin)
│  ├─ Constellation.tsx     # interactive magnetic particle field (Services)
│  └─ CursorRibbon.tsx      # global spring-chain ribbon trailing the pointer
├─ lib/
│  ├─ data.ts           # single source of truth for content (as const)
│  ├─ brand.ts          # per-technology brand colors for icons
│  ├─ fonts.ts          # next/font definitions
│  └─ lenis.tsx         # smooth-scroll helper
└─ styles/tokens.css
public/
├─ icons.js             # loads window.ICONS (inline tech-logo SVGs)
├─ logos/               # company logos for the timeline
└─ portrait.jpeg
```

### Page composition

`page.tsx` renders the whole site in order:

> Nav → Hero → Marquee → Stats strip → Stack → **About** → How I work → Journey → Location → Architecture → Code → Services → Projects → Contact → Footer

All content lives in `src/lib/data.ts` (`as const`) — edit copy, stack, services, timeline, and projects there rather than in the markup.

---

## Design system

The palette is **Indigo**, defined as CSS custom properties in `globals.css :root`. (Some token *names* are legacy, e.g. `--mint`, but they hold indigo values — change the values, not the names.)

| Token | Value | Role |
| --- | --- | --- |
| `--canvas` | `#F2F3FB` | page background |
| `--surface` | `#FFFFFF` | cards |
| `--ink` | `#0E0F1C` | primary text |
| `--mint` | `#5C63E6` | primary accent |
| `--mint-d` | `#4148C2` | accent text on light |
| `--blue` | `#8D92E8` | secondary (periwinkle) |
| `--dark` | `#101230` | dark / anchor sections |
| `--ease` | `cubic-bezier(.16,1,.3,1)` | the house easing curve |

**Motion principles**

- One coherent reveal system (`.rv` → `.in`) underpins everything, so sections feel related rather than individually decorated.
- Set-piece animations layer *on top* of that base; they're keyed off the same `.in` class so they fire reliably.
- Everything is one-shot (elements are unobserved after revealing) to keep scrolling cheap.
- `prefers-reduced-motion: reduce` is honored throughout — animations resolve to their final state instantly.

---

## Accessibility & performance

- Reduced-motion users get a fully static, readable page.
- Interactive flourishes (cursor ribbon, magnetic buttons) are pointer- and motion-gated.
- WebGL/Canvas pieces fail soft — the page content never depends on them rendering.
- The page is statically prerendered (`○ (Static)`), so first paint is fast.

---

## Deployment

Optimized for Vercel. `bun run build` produces a static-prerendered App Router build; deploy the repo directly or run `bun run start` behind any Node host.

---

## License

Personal portfolio — all rights reserved. Content, copy, and imagery © Zakaria Alizouaoui. Code is shared for reference; please don't redeploy it as your own portfolio.

— Built in Algiers 🇩🇿

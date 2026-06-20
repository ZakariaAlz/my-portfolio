# CLAUDE.md — Zack's Portfolio (handoff / source of truth)

> Read fully before coding. This reflects the ACTUAL built state as of 2026-06-19, not aspirations.
> The old "bible" (Stripe/aurora/indigo-plum-gold, Next 15, pnpm) is OBSOLETE — superseded by everything below.

---

## Working style (IMPORTANT)
- **Work autonomously. Do NOT ask the user to run commands or for confirmation** — run everything yourself (Bash, ffmpeg, builds, dev server). The user has authorized this.
- We are **near the context limit** — be token-efficient, avoid re-reading large files, don't re-derive known facts. This file is the handoff so a fresh session can continue.
- The user is **design-obsessive** and has rejected many "cheap/AI-slop" attempts — match the reference sites' quality; prefer rendered UI / canvas / WebGL over stock photos.

### Commit & verify discipline (MANDATORY)
- **Test your work EVERY single time before committing.** Never claim done or commit on faith. The verification ladder:
  1. `bunx tsc --noEmit` while iterating (doesn't touch `.next`, safe during `bun run dev`).
  2. `bun run build` at a checkpoint — **stop `next dev` first** (they share `.next`), build must stay green.
  3. **Render-verify** UI/animation changes in a real browser before saying it works — Playwright/Chromium is installed (`~/.cache/ms-playwright`). Screenshot the changed section + assert the relevant CSS classes/transforms actually applied. Don't trust the logic alone.
- **Small, focused commits.** One logical change per commit, conventional-commit style (`feat(scope):`, `fix:`, `docs:`, `ci:`). Commit as you go, not one giant dump at the end. End each message with the `Co-Authored-By: Claude Opus 4.8 (1M context)` trailer.
- **Branch for feature work** — never commit straight to `main`. Open a PR; CI must be green before merge. `main` is the production branch (auto-deploys — see CI/CD below).

## Who
**Zakaria "Zack" Alizouaoui** — Data Engineer & AI Specialist, **Algiers, Algeria**. Freelancer + full-time **Data Engineer at Dusens Research** (since Nov 2025). Email `zakariaalizouaoui.dev@gmail.com` · LinkedIn `/in/zakaria-alizouaoui` · GitHub `ZakariaAlz`.
Career arc (drives the timeline): **Software → Data → AI/Automation**. 4 internships + current role (see Journey).

## Stack (as built)
- **Next.js 16** (App Router, Turbopack) · **Bun** (not npm/pnpm) · TypeScript strict · **Tailwind v4** (`@import "tailwindcss"`).
- **three.js** (raw, imperative in `useEffect`) for WebGL — NOT R3F. `@gsap/react`, `gsap`, `framer-motion`, `@studio-freight/lenis` installed (GSAP/ScrollTrigger available for scroll cinematics).
- Repo: `/home/zakaria/Documents/DE Projects/my-portfolio/`. Dev: `bun run dev` → **http://localhost:3001** (port 3000 taken).
- Reference/design project (NOT the live app): `/home/zakaria/Documents/DE Projects/zack-portfolio/` — holds `assets/` (see below).

## Palette — INDIGO (LOCKED)
Switched from green→indigo on 2026-06-19 (user chose Indigo over navy/sand/gold in a side-by-side Claude artifact). **Do NOT reintroduce green/mint.** Token NAMES are legacy (`--mint` etc.) but hold indigo values. In `src/app/globals.css :root`:
- `--canvas:#F2F3FB` · `--canvas-2:#E9EBF8` · `--surface:#FFFFFF`
- `--ink:#0E0F1C` · `--ink-soft:#3A3D5C` · `--mute:#595C7A` · `--line:rgba(14,15,28,.12)`
- `--mint:#5C63E6` (PRIMARY accent) · `--mint-d:#4148C2` (accent text on light) · `--blue:#8D92E8` (periwinkle 2nd) · `--blue-d:#6065D8`
- `--dark:#101230` (dark/anchor sections) · accent-on-dark bright = `#9AA0FF`
- Kept intentionally as-is: macOS code-window **syntax colors** (GitHub-dark) and **tech-icon brand colors** (`src/lib/brand.ts`).
- Re-theming was done via `sed` on hardcoded hex/rgba + the `:root` block; if changing palette again, repeat that approach.

## Fonts (`src/lib/fonts.ts`, next/font)
**Bricolage Grotesque** (`--font-disp`, display) · **Hanken Grotesk** (`--font-text`, body) · **JetBrains Mono** (`--font-code`, labels) · **Caveat** (`--font-hand`, handwritten years in timeline). Applied via classNames on `<html>` in `layout.tsx`.

## Site structure (single page, `src/app/page.tsx` = one "use client" component)
Order: **Nav → Hero → Marquee → Stats strip → Stack → About → How I work (`#process`) → Journey → #based(location) → Architecture → Code → Services → Projects → Contact → Footer**.
Global: Lenis smooth-scroll + `IntersectionObserver` `.rv` reveals (set up first/independently so content never stays hidden; 2.5s failsafe) · **`CursorRibbon.tsx`** global glowing spring-chain ribbon trailing the pointer (fine-pointer + non-reduced-motion only, fades when idle, `z-index:45`) · a **3rd `useEffect` in `page.tsx`** wires **magnetic buttons + count-up stats + scroll-spy nav**.

### Components & current animations
- `LiquidHero.tsx` — full-screen **WebGL iridescent fluid** (indigo/periwinkle/violet shader), reacts to cursor + scroll. Hero bg.
- Hero also: **Make-style isometric scenario boards** (4 tilted glass tiles, tech-icon bubbles + curved connectors + flowing orbs) that build in → connect (`.iso-net` SVG) → then the **portrait card spawns** (rings + converging particles + scale/blur materialize). Staggered text entrance (`.e`). CTAs `.btn-grad` (indigo gradient).
- Marquee — infinite logo scroll, brand-colored icons, hover = **pause + grey others**. Immediately after: **count-up "by the numbers" stats strip** (`.statband`, IO-triggered rAF: 16M+ / 8 / 12+ / 4).
- `ArchitectureFlow.tsx` — **tabbed node-flow board** (Data Eng / Software Eng / DevOps), canvas bezier links + flowing pulses, draw-in. Dark panel.
- `CodeWindow.tsx` — macOS window, tabs `pipeline.py`/`revenue.sql`/`main.tf`, token-highlighted. **LIVE-TYPES the active file on scroll-in + re-types on tab switch** (periwinkle `#9AA0FF` caret: solid while typing, blinks when done).
- `HowIWork.tsx` — **pinned "How I work" scroll story** (`id="process"`, after About): sticky 100vh stage over a 440vh section; scroll-progress drives the active step (**Discover → Design → Build → Activate**) + a **self-filling pipeline rail**. Built on CSS `position:sticky` (NOT GSAP pin). Static stacked fallback on mobile / reduced-motion.
- `#based` — globe **RETIRED** (WebGL globe rejected many times); now a simple CSS **location pulse** ("Algiers" + "Freelancer · Algiers, Algeria"). `Globe.tsx` exists on disk but is **UNUSED** — do NOT rebuild a Stripe globe unless asked.
- `Constellation.tsx` — interactive magnetic particle field, used in **Services** (dark) section.
- **Journey** (in page.tsx) — **horizontal glossy "pebble" coin timeline** (Daniel Sun style): big domed metallic-glass coins, hover tilt, **handwritten years (Caveat)**, per-coin **year + "Internship"/"Full-time · Freelance"** labels, a **glowing line + comet → pulsing "now" terminus** (replaced the hand-drawn arrow), Dusens coin = mint→indigo jelly + **sparkles** celebration. Coins use `public/logos/*` (deltalog/talabastore/djezzy/algerie-telecom/dsr, all transparent PNG).
- Projects — cards + classy **"More, in the making"** card (sheen sweep + bobbing dots).

## Assets (in `zack-portfolio/assets/`)
- `logos/` → copied to `my-portfolio/public/logos/` (deltalog.png, talabastore.png, djezzy.png, algerie-telecom.png, dsr.png).
- `files/Resume_Zakaria_2026.pdf` — career source of truth.
- `palette_colors/` — Color Hunt palettes (filenames encode hex). `websites_images/*.png` — reference screenshots (Stripe/n8n/Make/Gumloop/Daniel Sun/Typeform).
- `recordings/*.webm|mp4` (22 clips) + **`recordings_frames/clipNN/` + `clipNN_montage.png`** (extracted via ffmpeg, `fps=1/2`, 6×8 tiles). Mapping: 01=blank/failed, 02=Gumloop, 03-05=Make, 06-08=n8n, 09-15=Stripe, 16=Daniel Sun, 17=Typeform, 18=InData Labs, 19=Yalantis, 20=Vercel, **21-22=Lusion**.
- `portrait.jpeg` (his photo) in `public/`. `public/icons.js` → `window.ICONS` (loaded `<Script afterInteractive>` INSIDE `<body>` — never a child of `<html>`, breaks hydration).

## Animation plan (audit + roadmap)
Published Claude artifacts (redeploy same path to update):
- **Animation Playbook & Plan:** `zack-portfolio/animation-plan.html` → https://claude.ai/code/artifact/51bb998e-805b-4e53-9ac8-f2c47c3b5cfb
- Palette preview (navy vs indigo): `zack-portfolio/palette-preview.html`.

**Verdict:** site already strong on big WebGL/canvas pieces; gaps = **scroll cinematics + micro-interactions**. Build order:
- **Tier 1 (quick wins): ✅ DONE 2026-06-20** — magnetic CTAs (nav/hero/contact, JS pointer-follow + spring-back) · count-up stats strip after marquee (16M+ records · 8 dashboards · 12+ tech · 4 internships; IO-triggered rAF cubic-ease) · scroll-spy active nav (IO, −45%/−50% center band) · hand-drawn doodle underline under hero "Engineer" (stroke-dashoffset draw-on). All in `page.tsx` (3rd `useEffect`) + `globals.css` (`.magnetic`/`.statband`/`.nav-links a.active`/`.doodle-underline`); build green, served CSS verified.
- **Tier 2 (showpieces): ✅ DONE 2026-06-20 (except parallax)** — ✅ **live-typing code window** (`CodeWindow.tsx`: types the active file char-by-char on scroll-in, re-types on tab switch; periwinkle `#9AA0FF` caret, solid while typing, blinks when done) · ✅ Typeform-style **pinned "How I work"** section (`HowIWork.tsx`, `id="process"`, placed after About; uses CSS `position:sticky` + scroll-progress→active step + a self-filling pipeline rail — NOT GSAP pin, more robust in React; static stacked fallback for mobile/reduced-motion) · ⏳ layered parallax screen-stack (BLOCKED — needs real project screenshots from user).
- **Tier 3:** Stack tile shimmer · data-gathering particle burst · FAQ accordion / rate slider · Yalantis story-loop.
- **LUSION (clip21/22, the "expensive" benchmark):** real-time WebGL 3D object cluster + **interactive cursor ribbon/spline trail** (signature) + reel-style video project tiles + tasteful bloom/grain. Full Lusion = specialist GPGPU (months); capture the FLAVOR: an **interactive mouse-following ribbon** (canvas/shader) is the highest-ROI Lusion touch — ✅ **DONE 2026-06-20** (`CursorRibbon.tsx`: global fixed canvas, spring-chain of 26 nodes each easing toward the previous, indigo→periwinkle tapered glowing stroke, visibility scales with pointer speed so it fades when idle; fine-pointer + non-reduced-motion only; `z-index:45`, under the nav; mounted in `page.tsx` after `.grain`). Everything is built ORIGINAL (techniques only, never their assets/copy).

## Gotchas
- **Dev server serves STALE CSS** sometimes (HMR wedges) → `kill` the my-portfolio `next dev`, `rm -rf .next`, restart, hard-refresh. Verify served CSS by curling the `/_next/static/chunks/*.css`.
- **Do NOT `bun run build` while `next dev` is running** — they share `.next`, so the build clobbers dev's chunks → stale/missing CSS. For mid-work checks use `bunx tsc --noEmit` (doesn't touch `.next`; HMR shows visuals live). Only full-`build` at a checkpoint *after stopping dev*, then `rm -rf .next` + restart dev. Also: curling a CSS chunk right after an HMR edit can show stale rules (browser gets HMR-injected CSS the curl doesn't) — trust a fresh `build` or a clean dev restart.
- Hydration: the icons `<Script>` must be in `<body>` (`afterInteractive`).
- `prefers-reduced-motion` respected throughout — keep it.
- `data.ts` is `as const`; timeline entries carry `period, org, role, phase, tone, logo, mono, current`.

## Commands
```bash
cd "/home/zakaria/Documents/DE Projects/my-portfolio"
bun run build      # verify (must stay green)
bun run dev        # http://localhost:3001
bunx tsc --noEmit  # fast typecheck, safe during dev (doesn't touch .next)
bun run lint       # eslint — must exit 0 (warnings ok, errors block CI)
# extract video frames: ffmpeg -i in.webm -vf "fps=1/2,scale=480:-1" out/f%03d.png
```

## Hosting & CI/CD (GitHub Actions → Cloudflare Pages)
- **Static export.** `next.config.ts` sets `output: "export"` (+ `images.unoptimized`, `trailingSlash`) — `bun run build` emits a static site to **`out/`** (no Node server; site has no API routes/server actions). Host is **Cloudflare Pages** (free, unlimited bandwidth, no card — chosen over Vercel/Hetzner for a static site).
- **`.github/workflows/ci.yml`** — every PR + push to `main`: `bun install --frozen-lockfile` → `tsc --noEmit` → `bun run lint` → `bun run build`. Merge gate; keep all four green.
- **`.github/workflows/deploy.yml`** — on push to `main`, builds and `wrangler pages deploy out` to Cloudflare Pages. **One-time setup:** add 2 repo secrets `CLOUDFLARE_API_TOKEN` (token template "Cloudflare Pages — Edit") + `CLOUDFLARE_ACCOUNT_ID`. No card. (Zero-secret alternative: connect the repo in the Cloudflare dashboard with build `bun run build`, output `out`, and delete deploy.yml.)
- **`/reference/`** (gitignored) holds the user's inspiration stash + screen recordings. It was in `public/assets/` but that made `out/` 671 MB (videos copied into the export) and blew Cloudflare's 25 MiB/file limit — keep big media OUT of `public/`.
- **ESLint note:** `react-hooks/set-state-in-effect` and `react-hooks/immutability` are downgraded to warnings in `eslint.config.mjs` — this codebase is intentionally imperative (three.js / canvas / scroll in `useEffect`); don't "fix" those by refactoring working components.

## Immediate next step
Tier 1 ✅ + Tier 2 ✅ (live-typing code · pinned "How I work" · Lusion cursor ribbon) shipped & build-verified 2026-06-20. Remaining:
- **Tier 3 polish:** stack-tile shimmer · data-gathering particle burst · FAQ / rate-slider · Yalantis story-loop.
- **BLOCKED on user assets:** layered **parallax project screen-stack** + reel-style video tiles need real dashboard/project screenshots — ask the user for them.
- **Optional Lusion extras / watch-outs:** tasteful bloom+grain pass; the cursor ribbon currently overlays the hero's WebGL fluid — if it reads as "too much," fade it while `scrollY < heroHeight`. Consider whether the pinned "How I work" (440vh) scroll length feels right.
**Dependencies: nothing to install** — `gsap`(+ScrollTrigger+SplitText), `@studio-freight/lenis`, `three`, `framer-motion`, `@gsap/react`, R3F/drei/postprocessing all present. `bun add` only if a new one is ever needed.

*Last updated: 2026-06-20 — Tier-1 + Tier-2 animations shipped (magnetic · count-up · scroll-spy · doodle · live-typing code · pinned "How I work" · cursor ribbon); Indigo locked; full 22-recording audit done. Plus: About section rebuilt into a composed reveal (masked heading + node rail) & global blur-in fade; staff-quality README; commit/verify discipline + GitHub Actions CI + Vercel prod deploy added.*

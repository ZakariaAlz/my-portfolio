# Phase 0 — Art Direction Re-skin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the existing single-page portfolio to the locked Blue/Black/White art direction (Cobalt `#2563EB`) and swap the type system to Schibsted Grotesk + Geist + JetBrains Mono — with no structural/layout changes.

**Architecture:** The site is one `"use client"` page (`src/app/page.tsx`) styled almost entirely through `src/app/globals.css` (`:root` tokens + class rules). Colors also live as literals inside three imperative WebGL/canvas components and one section component. We repoint the `:root` tokens, then mechanically map every remaining indigo literal to its Cobalt counterpart, then swap the two `next/font` families. No new dependencies.

**Tech Stack:** Next.js 16 (App Router, Turbopack), Bun, TypeScript strict, Tailwind v4 (`@import "tailwindcss"`), three.js (raw, imperative), `next/font/google`.

## Global Constraints

- **Package manager is Bun**, never npm/pnpm. Dev server: `bun run dev` → http://localhost:3001.
- **Never run `bun run build` while `bun run dev` is running** — they share `.next`. Use `bunx tsc --noEmit` for mid-work checks; only `bun run build` after stopping dev + `rm -rf .next`.
- **The only accent is Cobalt `#2563EB`.** Allowed colors: black/near-black, white, greys, Cobalt and its tints/glow. No green/mint values may be (re)introduced — the *token names* `--mint`/`--blue` are legacy and are deliberately kept (80+ references) but now hold Cobalt values.
- Keep `prefers-reduced-motion` handling intact everywhere it already exists.
- Keep the macOS code-window syntax colors (`CodeWindow.tsx`) and tech-brand icon colors (`src/lib/brand.ts`) **unchanged** — they are intentionally off-palette.
- CI gate must stay green: `bunx tsc --noEmit` · `bun run lint` · `bun run build` (static export to `out/`).
- No unit-test harness exists; this is a visual change. Each task is verified by `bunx tsc --noEmit` + a Playwright render check (screenshot + computed-style assertion), and the final task by a full `bun run build` + render audit. This is the project's established verification ladder (per CLAUDE.md), used here in place of TDD.

### Color mapping table (old indigo → new Cobalt) — used verbatim by Tasks 2–4

Hex (case-insensitive):
```
#5C63E6 → #2563EB   (primary accent)
#4148C2 → #1D4ED8   (accent dark)
#8488F2 → #5B8DEF   (gradient light stop)
#8D92E8 → #6AA0FF   (secondary / glow)
#6065D8 → #2563EB
#9AA0FF → #6AA0FF   (on-dark accent / focus ring)
#101230 → #08090C   (theater base)
#1B1F44 → #11132E   (arch-panel gradient hi)
#0E1030 → #0A0B1E   (arch-panel gradient lo)
#3A3D5C → #3F4651   (ink-soft)
#595C7A → #6B7280   (mute)
#F6F8FD → #F6F8FB   (grey canvas)
#EDEFFB → #EEF1F6   (project placeholder)
#E9EEFB → #EAF1FE   (project placeholder / blue-tint)
```
RGB triples inside `rgba(...)` (alpha preserved):
```
92,99,230   → 37,99,235     (Cobalt)
141,146,232 → 106,160,255   (glow)
14,15,28    → 8,9,12        (ink)
16,18,48    → 8,9,12        (dark)
210,213,255 → 180,205,255   (arch link hi)
154,160,255 → 106,160,255   (arch caption)
```

---

### Task 1: Swap font families (Schibsted Grotesk + Geist)

**Files:**
- Modify: `src/lib/fonts.ts` (full rewrite, 30 lines)
- Modify: `src/app/layout.tsx:3` and `:36`
- Modify: `src/app/globals.css:28-29` (font fallback stacks)

**Interfaces:**
- Produces: exports `schibsted` (var `--font-display`), `geist` (var `--font-body`), `jetbrains` (var `--font-mono`), `caveat` (var `--font-hand`). CSS vars `--font-disp`/`--font-text`/`--font-code` resolve to these. Consumed by `layout.tsx` (className list) and every `globals.css` rule using `var(--font-disp|text|code)`.

- [ ] **Step 1: Rewrite `src/lib/fonts.ts`**

```ts
import { Schibsted_Grotesk, Geist, JetBrains_Mono, Caveat } from "next/font/google";

export const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const geist = Geist({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
  display: "swap",
});
```

- [ ] **Step 2: Update `src/app/layout.tsx`**

Line 3 — replace the import:
```ts
import { schibsted, geist, jetbrains, caveat } from "@/lib/fonts";
```
Line 36 — replace the className list:
```tsx
    <html lang="en" className={`${schibsted.variable} ${geist.variable} ${jetbrains.variable} ${caveat.variable}`}>
```

- [ ] **Step 3: Update fallback stacks in `src/app/globals.css:28-29`**

```css
  --font-disp: var(--font-display), "Schibsted Grotesk", system-ui, sans-serif;
  --font-text: var(--font-body), "Geist", system-ui, sans-serif;
```
(Leave line 30 `--font-code` unchanged.)

- [ ] **Step 4: Typecheck**

Run: `bunx tsc --noEmit`
Expected: exits 0, no errors. (Confirms the new `next/font/google` named imports `Schibsted_Grotesk` and `Geist` resolve.)

- [ ] **Step 5: Render-verify the fonts load**

Start dev if not running: `bun run dev` (serves :3001). Then:
```bash
node -e 'const {chromium}=require("/home/zakaria/Documents/DE Projects/portfolio/node_modules/playwright");(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto("http://localhost:3001/",{waitUntil:"networkidle"});const f=await p.evaluate(()=>getComputedStyle(document.querySelector(".disp")||document.querySelector("h1,h2")).fontFamily);console.log("display font:",f);await p.screenshot({path:"/tmp/t1.png"});await b.close()})()'
```
Expected: logged font-family contains a `__Schibsted_Grotesk` / `--font-display` token (not Bricolage). Open `/tmp/t1.png` and confirm headings render in the new grotesk.

- [ ] **Step 6: Commit**

```bash
git add src/lib/fonts.ts src/app/layout.tsx src/app/globals.css
git commit -m "feat(type): swap to Schibsted Grotesk + Geist (Phase 0)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Repoint the `:root` color tokens to Cobalt

**Files:**
- Modify: `src/app/globals.css:3-26` (the `:root` token block, excluding the font lines already done)

**Interfaces:**
- Produces: `:root` custom properties `--canvas, --canvas-2, --surface, --ink, --ink-soft, --mute, --line, --mint, --mint-d, --blue, --blue-d, --glass-fill, --glass-border, --glow-a, --glow-b, --shadow-sm, --shadow-lg, --dark` plus new `--dark-2`, `--blue-tint`. Consumed by ~80 references across `globals.css`. Token *names* unchanged; only values change.

- [ ] **Step 1: Replace the token block (`globals.css` lines 3–26)**

Replace from the `/* ── Design tokens (Indigo) ── */` comment through the `--dark: #101230;` line with:

```css
/* ── Design tokens (Blue · Black · White — Cobalt #2563EB) ──── */
:root {
  --canvas:   #FFFFFF;
  --canvas-2: #F6F8FB;
  --surface:  #FFFFFF;
  --ink:      #08090C;
  --ink-soft: #3F4651;
  --mute:     #6B7280;
  --line:     rgba(8,9,12,.10);

  /* legacy names, Cobalt values: --mint = primary accent, --blue = secondary/glow */
  --mint:   #2563EB;
  --mint-d: #1D4ED8;
  --blue:   #6AA0FF;
  --blue-d: #2563EB;
  --blue-tint: #EAF1FE;

  --glass-fill:   rgba(255,255,255,.55);
  --glass-border: rgba(255,255,255,.7);
  --glow-a: rgba(37,99,235,.5);
  --glow-b: rgba(106,160,255,.45);

  --shadow-sm: 0 1px 2px rgba(9,13,22,.04), 0 8px 24px -16px rgba(9,13,22,.18);
  --shadow-lg: 0 30px 70px -36px rgba(9,13,22,.4);

  --dark:   #08090C;
  --dark-2: #0E0F12;
```
(Keep the existing `--font-disp/text/code` and `--ease` lines that follow, and the closing `}`.)

- [ ] **Step 2: Typecheck (CSS doesn't typecheck, but confirms nothing else broke)**

Run: `bunx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Render-verify token values served**

With dev running, hard-refresh, then:
```bash
node -e 'const {chromium}=require("/home/zakaria/Documents/DE Projects/portfolio/node_modules/playwright");(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto("http://localhost:3001/",{waitUntil:"networkidle"});const v=await p.evaluate(()=>{const s=getComputedStyle(document.documentElement);return{mint:s.getPropertyValue("--mint").trim(),ink:s.getPropertyValue("--ink").trim(),dark:s.getPropertyValue("--dark").trim()}});console.log(v);await b.close()})()'
```
Expected: `{ mint: '#2563EB', ink: '#08090C', dark: '#08090C' }`.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(theme): repoint :root tokens to Cobalt blue/black/white (Phase 0)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Recolor the hardcoded literals in `globals.css`

**Files:**
- Modify: `src/app/globals.css` (all hardcoded indigo hex + rgba literals outside `:root`)

**Interfaces:**
- Consumes: the mapping table in Global Constraints. Produces: a `globals.css` with zero indigo literals remaining (verified by grep).

- [ ] **Step 1: Apply the hex + rgb-triple mapping with sed**

```bash
cd "/home/zakaria/Documents/DE Projects/my-portfolio"
F=src/app/globals.css
sed -i -E \
 -e 's/#5C63E6/#2563EB/Ig' -e 's/#4148C2/#1D4ED8/Ig' -e 's/#8488F2/#5B8DEF/Ig' \
 -e 's/#8D92E8/#6AA0FF/Ig' -e 's/#6065D8/#2563EB/Ig' -e 's/#9AA0FF/#6AA0FF/Ig' \
 -e 's/#1B1F44/#11132E/Ig' -e 's/#0E1030/#0A0B1E/Ig' \
 -e 's/#EDEFFB/#EEF1F6/Ig' -e 's/#E9EEFB/#EAF1FE/Ig' \
 -e 's/92,99,230/37,99,235/g' -e 's/141,146,232/106,160,255/g' \
 -e 's/210,213,255/180,205,255/g' -e 's/154,160,255/106,160,255/g' \
 -e 's/16,18,48/8,9,12/g' \
 "$F"
```
(Note: `#101230` and the `14,15,28` ink rgba live only in the `:root` already rewritten in Task 2, so they are not re-mapped here. `#0E0F1C`, `#3A3D5C`, `#595C7A`, `#F6F8FD` likewise were `:root`-only.)

- [ ] **Step 2: Verify no indigo literals remain in globals.css**

```bash
grep -niE '#5C63E6|#4148C2|#8488F2|#8D92E8|#6065D8|#9AA0FF|#101230|#1B1F44|#0E1030|92,99,230|141,146,232|210,213,255|154,160,255|16,18,48' src/app/globals.css
```
Expected: **no output** (exit 1).

- [ ] **Step 3: Render-verify key surfaces are Cobalt**

With dev running, hard-refresh, then screenshot hero + a dark section:
```bash
node -e 'const {chromium}=require("/home/zakaria/Documents/DE Projects/portfolio/node_modules/playwright");(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});await p.goto("http://localhost:3001/",{waitUntil:"networkidle"});await p.screenshot({path:"/tmp/t3-hero.png"});await p.evaluate(()=>document.querySelector("#services")?.scrollIntoView());await p.waitForTimeout(800);await p.screenshot({path:"/tmp/t3-services.png"});await b.close()})()'
```
Expected: open both PNGs — buttons/accents read Cobalt blue (not indigo/violet); Services theater section reads near-black `#08090C`. No purple remnants.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(theme): recolor globals.css literals to Cobalt (Phase 0)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Recolor the components (section + WebGL/canvas shaders)

**Files:**
- Modify: `src/components/HowIWork.tsx` (5 indigo hex literals)
- Modify: `src/components/ArchitectureFlow.tsx:120,130,131,133` (rgba literals)
- Modify: `src/components/Constellation.tsx:9` (default `color` param)
- Modify: `src/components/LiquidHero.tsx:59-71` (shader `vec3` palette)

**Interfaces:**
- Consumes: the mapping table. Produces: components with Cobalt-family colors; `Constellation` default `color="37,99,235"`.

- [ ] **Step 1: sed the hex/rgba literals in HowIWork + ArchitectureFlow**

```bash
cd "/home/zakaria/Documents/DE Projects/my-portfolio"
sed -i -E -e 's/#5C63E6/#2563EB/Ig' -e 's/#4148C2/#1D4ED8/Ig' -e 's/#8D92E8/#6AA0FF/Ig' \
 -e 's/#9AA0FF/#6AA0FF/Ig' -e 's/#101230/#08090C/Ig' -e 's/#0E0F1C/#08090C/Ig' \
 -e 's/92,99,230/37,99,235/g' -e 's/141,146,232/106,160,255/g' \
 -e 's/210,213,255/180,205,255/g' -e 's/154,160,255/106,160,255/g' \
 src/components/HowIWork.tsx src/components/ArchitectureFlow.tsx
```

- [ ] **Step 2: Update `Constellation.tsx` default color (line 9)**

Change:
```tsx
  color = "92,99,230",
```
to:
```tsx
  color = "37,99,235",
```

- [ ] **Step 3: Replace the LiquidHero shader palette (`LiquidHero.tsx:59-71`)**

Replace each `vec3(...)` on these lines with its Cobalt-family counterpart (keep the surrounding code/line structure identical):
```
line 59: vec3(0.64,0.64,0.74)   → vec3(0.62,0.66,0.78)
line 60: vec3(0.30,0.30,0.40)   → vec3(0.20,0.30,0.50)
line 61: vec3(0.90,0.90,1.00)   → vec3(0.90,0.93,1.00)
line 62: vec3(0.30,0.22,0.50)   → vec3(0.13,0.27,0.62)
line 65: vec3(0.36,0.39,0.90)   → vec3(0.15,0.40,0.92)
line 66: vec3(0.55,0.57,0.95)   → vec3(0.42,0.63,1.00)
line 67: vec3(0.42,0.30,0.85)   → vec3(0.16,0.39,0.92)
line 68: vec3(0.72,0.74,1.00)   → vec3(0.66,0.78,1.00)
line 71: vec3(0.949,0.953,0.984)→ vec3(0.98,0.99,1.00)
```

- [ ] **Step 4: Verify no indigo literals remain in components**

```bash
grep -rniE '#5C63E6|#4148C2|#8D92E8|#9AA0FF|92,99,230|141,146,232|210,213,255|154,160,255' src/components
```
Expected: **no output** (exit 1).

- [ ] **Step 5: Typecheck**

Run: `bunx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 6: Render-verify the hero fluid + architecture + services constellation are Cobalt**

```bash
node -e 'const {chromium}=require("/home/zakaria/Documents/DE Projects/portfolio/node_modules/playwright");(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});await p.goto("http://localhost:3001/",{waitUntil:"networkidle"});await p.waitForTimeout(1200);await p.screenshot({path:"/tmp/t4-hero.png"});for(const id of ["architecture","services"]){await p.evaluate(i=>document.getElementById(i)?.scrollIntoView(),id);await p.waitForTimeout(1000);await p.screenshot({path:`/tmp/t4-${id}.png`})}await b.close()})()'
```
Expected: hero WebGL fluid reads as cool Cobalt blues (no violet); ArchitectureFlow links/pulses are Cobalt; Services constellation particles are Cobalt.

- [ ] **Step 7: Commit**

```bash
git add src/components/HowIWork.tsx src/components/ArchitectureFlow.tsx src/components/Constellation.tsx src/components/LiquidHero.tsx
git commit -m "feat(theme): recolor WebGL/canvas + process components to Cobalt (Phase 0)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Full build + render audit, and update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (Palette + Fonts sections; note CursorRibbon removed)

**Interfaces:** none — this is the integration gate + docs sync.

- [ ] **Step 1: Stop dev, clean build**

```bash
pkill -f "my-portfolio.*next dev" 2>/dev/null; sleep 1
cd "/home/zakaria/Documents/DE Projects/my-portfolio"
rm -rf .next && bun run build 2>&1 | tail -15
```
Expected: `✓ Compiled successfully`, TypeScript finished, static pages generated, no errors.

- [ ] **Step 2: Lint**

Run: `bun run lint`
Expected: exits 0 (warnings allowed, no errors).

- [ ] **Step 3: Full-page render audit of the static export**

```bash
cd out && (python3 -m http.server 4178 >/dev/null 2>&1 &) ; sleep 1
node -e 'const {chromium}=require("/home/zakaria/Documents/DE Projects/portfolio/node_modules/playwright");(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});await p.goto("http://localhost:4178/",{waitUntil:"networkidle"});const H=await p.evaluate(()=>document.body.scrollHeight);for(let i=0,n=Math.ceil(H/900);i<n;i++){await p.evaluate(y=>scrollTo(0,y),i*900);await p.waitForTimeout(500);await p.screenshot({path:`/tmp/audit-${String(i).padStart(2,"0")}.png`})}await b.close();console.log("chunks",Math.ceil(H/900))})()'
```
Expected: review all `/tmp/audit-*.png` — every section reads Blue/Black/White, headings in Schibsted, body in Geist, theater sections true-black, accents Cobalt. No indigo/violet anywhere, no fallback-font flashes, no broken layout.

- [ ] **Step 4: Update CLAUDE.md Palette + Fonts + components**

In `CLAUDE.md`: replace the `## Palette — INDIGO (LOCKED)` section body with the Cobalt token table (from the design spec); update `## Fonts` to Schibsted Grotesk (`--font-disp`) + Geist (`--font-text`) + JetBrains Mono + Caveat; in the components list, remove the `CursorRibbon.tsx` description (file no longer exists) and note the journey uses scroll-scrubbed pipeline. Add a one-line pointer to `docs/superpowers/specs/2026-06-22-lusion-grade-redesign-design.md` as the redesign source of truth.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md palette/fonts to Cobalt + Schibsted/Geist (Phase 0)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Push branch + open PR**

```bash
git push -u origin feat/lusion-grade-redesign
gh pr create --title "feat: Phase 0 — Blue/Black/White Cobalt re-skin + Schibsted/Geist type" \
  --body "Phase 0 of the Lusion-grade redesign (spec: docs/superpowers/specs/2026-06-22-lusion-grade-redesign-design.md). Color tokens repointed to Cobalt #2563EB on a light Apple/Stripe/Kantar canvas with true-black theater sections; type swapped to Schibsted Grotesk + Geist + JetBrains Mono. No structural changes. Render-audited end to end; build + lint green.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```
Expected: PR opens; CI (tsc · lint · build) runs green.

---

## Self-Review

**Spec coverage (Phase 0 section of the design spec):**
- Foundation light + dark theater → Tasks 2/3 (true-black `--dark`, theater sections recolored). ✓
- Color tokens locked → Task 2 (`:root`) + Tasks 3/4 (literals). ✓
- Typography locked → Task 1. ✓
- Background system (alternating bands) → existing `--canvas`/`--canvas-2` alternation preserved; values updated in Task 2. ✓ (The new **WebGL mesh-gradient** behind the hero is deliberately deferred to Phase 2 with the LiquidHero elevation — Phase 0 recolors the *existing* hero fluid instead. Noted as a scope refinement.)
- Proportions overhaul (980/1200 containers, 120px rhythm) → **deferred to Phase 1** (scroll & layout) to keep Phase 0 a low-risk re-skin with no structural churn. Noted; spec phase note to be updated when Phase 1 starts.
- Motion/finish (bloom/grain) → existing `.grain` retained; post-FX bloom is Phase 2. ✓ (out of Phase 0 scope by design)

**Placeholder scan:** No TBD/TODO; every code/sed step is concrete. ✓

**Type consistency:** `schibsted`/`geist` exports used identically in `fonts.ts` and `layout.tsx`; CSS var names unchanged so all 80 references stay valid; `Constellation` default param name `color` unchanged (value only). ✓

**Deviations from spec flagged for user:** (1) hero mesh-gradient and (2) proportions overhaul are pulled out of Phase 0 into later phases so Phase 0 ships as a pure, reversible re-skin. If you want them inside Phase 0 instead, say so and I'll fold them in.

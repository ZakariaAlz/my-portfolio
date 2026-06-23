# Lusion-grade Portfolio Redesign — Design Spec

> Status: **Phase 0 (art direction) approved by user 2026-06-22.** Phases 1–4 are scoped here but each gets its own spec before build.
> This document supersedes the palette/typography sections of `CLAUDE.md`. When this work lands, update `CLAUDE.md` to match.

## Goal

Rebuild the portfolio to the caliber of **Lusion · Apple · Stripe · Kantar** — an experience smooth and considered enough to stop people scrolling, without reading as templated or "AI-slop." The bar is the user's own words: *"a portfolio like a designer where the experience is so smooth that it would leave everybody on the web shocked… pixel perfect."*

### Calibration (the honest constraint)
Lusion is a ~7-person studio (founder Edan Kwan, Bristol) running 3-week–1-month sprints with offline Houdini/Redshift render farms. We are **not** reproducing a full Lusion site. We **capture the feel** with a handful of techniques executed flawlessly, on a light Stripe/Kantar foundation with dark Lusion-style "theater" moments. Sources for all technical claims live in the research appendix at the end.

## Subject

**Zakaria "Zack" Alizouaoui** — Data Engineer & AI Specialist, Algiers. Career arc Software → Data → AI/Automation. Freelancer + full-time Data Engineer at Dusens Research. The site's single job: convince a prospective client or employer, in the first 10 seconds and then in depth, that he builds data/AI systems that don't break — and that he has exceptional taste.

---

## Phase 0 — Art Direction (APPROVED)

### Foundation
**Light base with dramatic dark "theater" sections.** Predominantly white/grey Apple/Stripe/Kantar canvas; a few full-bleed near-black sections (hero 3D, selected work, contact) for Lusion-style contrast and where Cobalt glows.

### Color tokens (LOCKED)
Replaces the legacy indigo `:root` tokens entirely. Token names should be made honest this time (`--blue`, not `--mint`).

```
LIGHT (primary canvas)              DARK (theater sections)
--bg          #FFFFFF               --black         #08090C
--bg-alt      #F6F8FB   (grey band) --black-2       #0E0F12
--bg-panel    #EEF1F6   (inset)     --ink-on-dark   #F2F4F7
--ink         #08090C   (near-black)--mute-on-dark  #A2A8B3
--ink-soft    #3F4651               --blue-glow     #6AA0FF
--mute        #6B7280               --blue-bright   #8FB6FF
--line        rgba(8,9,12,.10)      --line-dark     rgba(255,255,255,.12)
--blue        #2563EB   (Cobalt — primary accent)
--blue-d      #1D4ED8   (hover / accent text on light)
--blue-tint   #EAF1FE   (chips, pills, soft fills)
```

Rule: Cobalt is the *only* accent. Black, white, grey, and Cobalt — nothing else. Color enters elsewhere only through real content (project screenshots, tech-brand icons).

### Typography (LOCKED)
- **Display:** Schibsted Grotesk — 700/800, big sizes, negative tracking (`-0.025em` to `-0.035em`). Carries hero/section headlines with authority.
- **Body:** Geist — 400/500/600, line-height ~1.55, tracking `-0.005em`. Quiet, modern, precise.
- **Labels/eyebrows/code:** JetBrains Mono — 500/700, uppercase eyebrows with `0.18em–0.2em` tracking, in Cobalt.

Type scale (display sizes via `clamp()`):
```
h1  clamp(40px, 6vw, 64px)  Schibsted 800  lh 1.0   ls -0.035em
h2  clamp(28px, 4vw, 40px)  Schibsted 700  lh 1.08  ls -0.025em
h3  22px                    Schibsted 700  lh 1.1   ls -0.02em
body 17–18px                Geist 400      lh 1.55  ls -0.005em
eyebrow 12–13px             JetBrains 500  uppercase ls 0.18em  Cobalt
```

### Background system
- Light sections alternate `--bg` ↔ `--bg-alt` band to band. `--bg-panel` for inset cards/panels only.
- **One living gradient:** a WebGL mesh-gradient (the Stripe technique — a subdivided plane displaced by layered noise in a vertex shader; reference impl `whatamesh`/`Gradient.js`), recolored to Cobalt + `--blue-glow`, rendered behind **only the hero**, at **opacity ~0.12–0.18 with heavy blur**. It reads as a faint living tint over white, never a saturated wash. Pauses when off-screen.
- Dark theater sections: solid `--black`, with Cobalt delivered as glow (post-FX bloom + radial light), not flat fills.

### Proportions (Apple + Kantar)
```
--content  980px    text / about / process columns
--wide     1200px   project & stat grids, dark theater content
--gutter   24px
section padding-block: 120px desktop → 64px mobile
~64px of air above every headline (Apple "pedestal")
spacing scale (8px base): 4 8 12 16 24 32 48 64 96 120
radii: 8px default (engineered, not soft); pills only for tags
shadows: at most one in the system, on elevated imagery only
```
Borrow Kantar's recurring **oversized stat band** and feature-card rhythm.

### Light ↔ dark rhythm
The page breathes light → dark → light on purpose:
`Nav → Hero (light + faint gradient) → light content (stack/about/process) → DARK theater (signature 3D / selected work) → light → DARK contact → footer.`
Dark bands concentrate motion and Cobalt glow; light bands stay calm and spacious.

### Motion & finish principles
- **Smooth scroll:** Lenis + GSAP/ScrollTrigger for choreography (built in Phase 1). Steal Lusion's WebGL-Scroll-Sync offset trick if any canvas is pinned to a DOM element.
- **Post-FX (dark sections only):** `pmndrs/postprocessing` — **selective, high-threshold bloom** on emissive Cobalt + **subtle film grain (~4%)** + faint vignette. Restraint is the entire game; over-cranked bloom is the #1 AI-slop tell.
- **Discipline cap:** at most two of {vivid accent, dense atmosphere, kinetic motion} run at full intensity at once.
- `prefers-reduced-motion` respected everywhere; all WebGL pauses off-screen; mobile gets lighter LODs / static fallbacks.

---

## Phased roadmap (each phase = its own spec → build → verify)

- **Phase 0 — Art direction foundation** *(this spec, approved).* Re-theme tokens, swap fonts, establish the background/proportion/motion system. No new heavy assets needed. Ends with the existing site re-skinned to Blue/Black/White + Schibsted/Geist, light↔dark rhythm in place.
- **Phase 1 — Scroll & page choreography.** Tune Lenis; add GSAP/ScrollTrigger cinematic section transitions and reveals; WebGL-scroll-sync where needed.
- **Phase 2 — Signature 3D.** Recolor/elevate `LiquidHero` to the Cobalt mesh-gradient + a hero 3D moment; instanced-cursor interaction (Lusion signature); one GPGPU curl-noise particle moment; the post-FX pass. All hand-written procedural GLSL in three.js (no Blender/AI for the hero).
- **Phase 3 — Project reel.** Real projects as Lusion-style dark tiles using the user's 4K images; optionally one Gaussian-splat (`.spz` + Spark renderer) photoreal moment from supplied capture.
- **Phase 4 — Pixel-perfect & perf.** 60fps budget, mobile, reduced-motion, accessibility, Lighthouse.

### Tooling decisions (from research)
- **Hero 3D:** hand-written procedural GLSL in raw three.js (matches existing stack and Lusion's from-scratch culture). NOT Spline (6.8MB runtime, CWV tax), NOT AI-3D for the centerpiece.
- **AI 3D (Rodin/Tripo):** only for a *background prop cluster*, if at all.
- **Gaussian splatting:** the one genuinely new 2026 capability — for ONE photoreal moment from the user's 4K assets. Format `.spz`, renderer Spark (World Labs), budget <3M splats, mind COOP/COEP headers.
- **Asset compression:** `glTF-Transform` → Draco + KTX2 whenever a GLB ships.
- **Post-FX:** `pmndrs/postprocessing` (merges passes; far cheaper than raw EffectComposer).

### Assets pending from user
- Fresh Lusion screen recording (drives Phase 2 reference).
- 4K project images (drive Phase 3 reel + possible splat).
Phase 0 and Phase 1 do **not** block on these.

---

## Dependencies
New fonts: add **Schibsted Grotesk** + **Geist** via `next/font` (both on Google Fonts); keep JetBrains Mono; Bricolage Grotesque + Hanken Grotesk get removed once Phase 0 lands. Later phases: `pmndrs/postprocessing`, and (Phase 3) a Gaussian-splat renderer — installed per-phase, not now.

## Out of scope (YAGNI)
- Reproducing full Lusion-grade Houdini-baked simulations.
- WebGPU/TSL rewrite (note it as a future direction; stay on WebGL2 + raw GLSL for now).
- R3F migration (stack stays imperative three.js).
- Any green/mint reintroduction (permanently retired).

## Success criteria
- Side-by-side, the redesign reads as belonging in the same tier as Stripe/Kantar for restraint and Lusion for motion craft.
- 60fps on the dark/3D sections on a mid-range laptop; graceful mobile + reduced-motion fallbacks.
- Zero "AI-slop" tells: no over-bloom, no saturated gradient wash, no templated stat-hero, no default Inter.
- CI stays green (tsc · lint · build · static export to `out/`).

---

## Research appendix (sources)
- Lusion stack & techniques: Lusion's own Awwwards case study; Codrops Lusion feature (Apr 2026); `github.com/lusionltd/WebGL-Scroll-Sync`; Codrops instanced-cursor tutorial (2023); `github.com/edankwan/The-Spirit` (GPGPU curl noise).
- Apple/Stripe/Kantar aesthetic: Apple & Stripe design-token extractions; Stripe gradient teardown (Codrops, Kevin Hufnagl); `whatamesh` / `Gradient.js`.
- Tooling: glTF-Transform; meshoptimizer; KTX2/Basis; Rodin/Tripo/Meshy/Sloyd; Spline runtime CWV analysis; Niantic `.spz` + Spark (World Labs); pmndrs/postprocessing; Book of Shaders / Codrops / Maxime Heckel for GLSL.

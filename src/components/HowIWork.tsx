"use client";
import { useEffect, useRef, useState, type ReactElement } from "react";

/* "The Process" — a node-flow pipeline in the n8n / Make / Gumloop language,
   rendered in our clean white + indigo palette. Four workflow "module" nodes
   wired by curved bezier connectors on a dot-grid canvas; data packets flow
   along the wires and each node executes in sequence as the pinned section
   scrolls. Collapses to a static stacked list on mobile / reduced-motion. */

type Step = {
  k: string; n: string; title: string; tag: string; body: string;
  icon: "discover" | "design" | "build" | "activate";
  cx: number; cy: number; // node centre, as % of the 1000×340 canvas
};

const STEPS: Step[] = [
  { k: "discover", n: "01", title: "Discover", tag: "map",   icon: "discover", cx: 13, cy: 58.8,
    body: "I map the sources, the stakeholders, and the exact decision the data has to serve — before a line of pipeline code." },
  { k: "design",   n: "02", title: "Design",   tag: "model", icon: "design",   cx: 38, cy: 32.4,
    body: "I model the schemas and data contracts first, so the warehouse stays trustworthy as it grows." },
  { k: "build",    n: "03", title: "Build",    tag: "ship",  icon: "build",    cx: 64, cy: 61.8,
    body: "I ship the pipeline — ingest, transform, test, deploy — versioned, containerized, and observable by default." },
  { k: "activate", n: "04", title: "Activate", tag: "serve", icon: "activate", cx: 88, cy: 32.4,
    body: "I layer dashboards, alerts, and AI on top — the part that turns clean data into decisions that compound." },
];

// Curved connectors between consecutive node centres, in the 1000×340 viewBox.
const LINKS = [
  "M130 200 C 250 200, 270 110, 380 110",
  "M380 110 C 500 110, 530 210, 640 210",
  "M640 210 C 760 210, 770 110, 880 110",
];

function StepIcon({ k }: { k: Step["icon"] }): ReactElement {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (k) {
    case "discover":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.2" {...p} /><path d="M15.6 15.6 L20 20" {...p} /></svg>;
    case "design":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L20 7 L12 11 L4 7 Z" {...p} /><path d="M4 12 L12 16 L20 12" {...p} /><path d="M4 17 L12 21 L20 17" {...p} /></svg>;
    case "build":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="9" width="6" height="6" rx="1.4" {...p} /><rect x="14.5" y="9" width="6" height="6" rx="1.4" {...p} /><path d="M9.5 12 L14.5 12" {...p} /><path d="M6.5 9 V6 M17.5 15 V18" {...p} /></svg>;
    case "activate":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L14 9.5 L20.5 12 L14 14.5 L12 21 L10 14.5 L3.5 12 L10 9.5 Z" {...p} /></svg>;
  }
}

export default function HowIWork() {
  const [active, setActive] = useState(0);
  const [flat, setFlat] = useState(false); // reduced-motion → render static
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setFlat(!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (flat) { setActive(STEPS.length - 1); return; }
    let raf = 0;
    const compute = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const passed = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      const p = total > 0 ? passed / total : 0;
      setActive(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(compute); };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [flat]);

  return (
    <section className={`howwork ${flat ? "flat" : ""}`} id="process" ref={sectionRef} aria-label="How I work">
      <div className="howwork-pin">
        <div className="howwork-head">
          <div className="seclabel">The Process</div>
          <h2 className="sectitle disp">Four steps from raw data to decisions.</h2>
        </div>

        {/* node-flow pipeline canvas */}
        <div className="flow" aria-hidden="true">
          <svg className="flow-wires" viewBox="0 0 1000 340" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="hwWire" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#5C63E6" />
                <stop offset="1" stopColor="#8D92E8" />
              </linearGradient>
            </defs>
            {LINKS.map((d, i) => (
              <g key={i} className={`wire ${i < active ? "done" : ""} ${i === active ? "live" : ""}`}>
                <path id={`hwlnk${i}`} className="wire-base" d={d} />
                <path className="wire-flow" d={d} />
                <circle className="packet" r="4.2">
                  <animateMotion dur={`${2.3 + i * 0.25}s`} repeatCount="indefinite">
                    <mpath href={`#hwlnk${i}`} />
                  </animateMotion>
                </circle>
              </g>
            ))}
          </svg>

          {STEPS.map((s, i) => (
            <div
              key={s.k}
              className={`flow-node ${i < active ? "done" : ""} ${i === active ? "on" : ""}`}
              style={{ left: `${s.cx}%`, top: `${s.cy}%` }}
            >
              <span className="fn-port l" />
              <span className="fn-port r" />
              <span className="fn-ic"><StepIcon k={s.icon} /></span>
              <span className="fn-meta"><b>{s.title}</b><i>{s.tag}</i></span>
            </div>
          ))}
        </div>

        {/* active step detail (crossfade) */}
        <div className="flow-detail">
          {STEPS.map((s, i) => (
            <article key={s.k} className={`fd-step ${i === active ? "on" : ""}`} aria-hidden={i === active ? undefined : true}>
              <span className="fd-n">{s.n} <i>/ 04</i></span>
              <h3 className="fd-title disp">{s.title}</h3>
              <p className="fd-body">{s.body}</p>
            </article>
          ))}
        </div>

        <div className="howwork-progress" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span key={s.k} className={`hw-pip ${i === active ? "on" : ""}`} />
          ))}
        </div>

        {/* mobile / reduced-motion: simple stacked list */}
        <ul className="flow-list">
          {STEPS.map((s) => (
            <li key={s.k} className="fl-item">
              <span className="fn-ic"><StepIcon k={s.icon} /></span>
              <div>
                <b>{s.n} · {s.title}</b>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

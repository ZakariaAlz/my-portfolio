"use client";
import { useEffect, useRef, useState, type ReactElement } from "react";

/* Typeform/Apple-style pinned "story" section.
   The section is tall; an inner stage is position:sticky and holds the frame.
   Scroll progress through the section drives the active step + a self-filling
   pipeline rail. No GSAP pin (sticky is more robust inside React); Lenis makes
   the scrub feel smooth. Collapses to a static stacked list on mobile / reduced-motion. */

type Step = { k: string; n: string; title: string; body: string; icon: "discover" | "design" | "build" | "activate" };

const STEPS: Step[] = [
  { k: "discover", n: "01", title: "Discover", icon: "discover",
    body: "I map the sources, the stakeholders, and the exact decision the data has to serve — before a line of pipeline code." },
  { k: "design", n: "02", title: "Design", icon: "design",
    body: "I model the schemas and data contracts first, so the warehouse stays trustworthy as it grows." },
  { k: "build", n: "03", title: "Build", icon: "build",
    body: "I ship the pipeline — ingest, transform, test, deploy — versioned, containerized, and observable by default." },
  { k: "activate", n: "04", title: "Activate", icon: "activate",
    body: "I layer dashboards, alerts, and AI on top — the part that turns clean data into decisions that compound." },
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
  const pinRef = useRef<HTMLDivElement>(null);

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
      const idx = Math.min(STEPS.length - 1, Math.floor(p * STEPS.length));
      setActive(idx);
      pinRef.current?.style.setProperty("--hw-fill", String(p));
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
      <div className="howwork-pin" ref={pinRef}>
        <div className="howwork-head">
          <div className="seclabel">The Process</div>
          <h2 className="sectitle disp">Four steps from raw data to decisions.</h2>
        </div>

        <div className="howwork-body">
          {/* left — the active step (steps stacked; active fades up) */}
          <div className="howwork-text">
            {STEPS.map((s, i) => (
              <article key={s.k} className={`hw-step ${i === active ? "on" : ""}`} aria-hidden={i === active ? undefined : true}>
                <span className="hw-step-n">{s.n}</span>
                <h3 className="hw-step-title disp">{s.title}</h3>
                <p className="hw-step-body">{s.body}</p>
              </article>
            ))}
          </div>

          {/* right — self-filling pipeline rail */}
          <div className="howwork-rail" aria-hidden="true">
            <span className="hw-track"><span className="hw-track-fill" /></span>
            <div className="hw-nodes">
              {STEPS.map((s, i) => (
                <div key={s.k} className={`hw-node ${i <= active ? "done" : ""} ${i === active ? "on" : ""}`}>
                  <span className="hw-dot"><StepIcon k={s.icon} /></span>
                  <span className="hw-node-label">{s.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="howwork-progress" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span key={s.k} className={`hw-pip ${i === active ? "on" : ""}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

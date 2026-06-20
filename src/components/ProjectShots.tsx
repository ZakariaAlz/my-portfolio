"use client";
import { useEffect, useRef, useState } from "react";

/* Crossfading succession of a project's real screenshots / diagrams.
   Auto-advances only while the card is on screen; pauses off-screen and
   under reduced-motion. A single image renders static (no dots). */
export default function ProjectShots({ shots, alt }: { shots: readonly string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shots.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const el = wrapRef.current;
    if (!el) return;
    let timer: number | undefined;
    const io = new IntersectionObserver((es) => {
      if (es[0].isIntersecting) {
        if (!timer) timer = window.setInterval(() => setIdx((i) => (i + 1) % shots.length), 3000);
      } else if (timer) {
        clearInterval(timer); timer = undefined;
      }
    }, { threshold: 0.35 });
    io.observe(el);
    return () => { if (timer) clearInterval(timer); io.disconnect(); };
  }, [shots.length]);

  return (
    <div className="shots" ref={wrapRef}>
      {shots.map((s, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={s}
          className={`shot-img ${i === idx ? "on" : ""}`}
          src={s}
          alt={i === 0 ? alt : ""}
          loading="lazy"
          aria-hidden={i !== idx}
        />
      ))}
      {shots.length > 1 && (
        <span className="shots-dots" aria-hidden="true">
          {shots.map((s, i) => <i key={s} className={i === idx ? "on" : ""} />)}
        </span>
      )}
    </div>
  );
}

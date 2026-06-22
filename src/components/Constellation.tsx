"use client";
import { useEffect, useRef } from "react";

/* Interactive constellation: drifting nodes + proximity links.
   The cursor/touch pushes nearby nodes away and draws bright links to them —
   so it feels "touchable". DPR-aware, pauses offscreen, respects reduced-motion. */

export default function Constellation({
  color = "37,99,235",
  density = 9000,
  linkDist = 132,
}: { color?: string; density?: number; linkDist?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0, dpr = 1, raf = 0, vis = true;
    let pts: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    const mouse = { x: -9999, y: -9999 };

    const build = () => {
      const count = Math.min(140, Math.round((canvas.clientWidth * canvas.clientHeight) / density));
      pts = [];
      for (let i = 0; i < count; i++) {
        pts.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.32 * dpr, vy: (Math.random() - 0.5) * 0.32 * dpr,
          r: (Math.random() * 1.7 + 0.7) * dpr,
        });
      }
    };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      H = canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      build();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const LD = linkDist * dpr;
    const PUSH = 150 * dpr;
    const setMouse = (cx: number, cy: number) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (cx - r.left) * dpr;
      mouse.y = (cy - r.top) * dpr;
    };
    const onMove = (e: MouseEvent) => setMouse(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => { if (e.touches[0]) setMouse(e.touches[0].clientX, e.touches[0].clientY); };
    const onLeave = () => { mouse.x = mouse.y = -9999; };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("mouseout", onLeave);

    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        const dxm = p.x - mouse.x, dym = p.y - mouse.y, dm = Math.hypot(dxm, dym) || 1;
        if (dm < PUSH) { const f = (PUSH - dm) / PUSH; p.x += (dxm / dm) * f * 2.4; p.y += (dym / dm) * f * 2.4; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fillStyle = `rgba(${color},0.7)`; ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.hypot(dx, dy);
          if (d < LD) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(${color},${(0.2 * (1 - d / LD)).toFixed(3)})`;
            ctx.lineWidth = dpr; ctx.stroke();
          }
        }
        // bright link to the cursor — the "touch"
        const cdx = pts[i].x - mouse.x, cdy = pts[i].y - mouse.y, cd = Math.hypot(cdx, cdy);
        if (cd < LD * 1.5) {
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(${color},${(0.4 * (1 - cd / (LD * 1.5))).toFixed(3)})`;
          ctx.lineWidth = 1.2 * dpr; ctx.stroke();
        }
      }
      if (vis) raf = requestAnimationFrame(frame); else raf = 0;
    }

    const io = new IntersectionObserver((es) => {
      vis = es[0].isIntersecting;
      if (vis && !raf && !reduce) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);
    if (reduce) frame(); else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("mouseout", onLeave);
    };
  }, [color, density, linkDist]);

  return <canvas className="constellation-bg" ref={ref} aria-hidden="true" />;
}

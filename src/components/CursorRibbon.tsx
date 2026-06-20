"use client";
import { useEffect, useRef } from "react";

/* Lusion-style cursor ribbon: a spring chain of nodes trailing the pointer,
   drawn as a tapered, glowing indigo→periwinkle stroke. Flows and settles,
   fades out when the pointer is idle. Desktop fine-pointer only; off for
   touch and reduced-motion. Pure canvas2d — no dependency. */

export default function CursorRibbon() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const fine = window.matchMedia?.("(pointer: fine)").matches;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const N = 26;
    const mouse = { x: W / 2, y: H / 2 };
    const pts = Array.from({ length: N }, () => ({ x: W / 2, y: H / 2 }));
    let has = false, vis = 0, lastX = mouse.x, lastY = mouse.y;

    const onMove = (e: MouseEvent) => {
      if (!has) { for (const p of pts) { p.x = e.clientX; p.y = e.clientY; } has = true; }
      mouse.x = e.clientX; mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    let raf = 0;
    const frame = () => {
      pts[0].x += (mouse.x - pts[0].x) * 0.32;
      pts[0].y += (mouse.y - pts[0].y) * 0.32;
      for (let i = 1; i < N; i++) {
        pts[i].x += (pts[i - 1].x - pts[i].x) * 0.34;
        pts[i].y += (pts[i - 1].y - pts[i].y) * 0.34;
      }
      const speed = Math.hypot(mouse.x - lastX, mouse.y - lastY);
      lastX = mouse.x; lastY = mouse.y;
      const target = has ? Math.min(1, speed / 6) : 0;
      vis += (target - vis) * (target > vis ? 0.25 : 0.06);

      ctx.clearRect(0, 0, W, H);
      if (vis > 0.012) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowBlur = 12;
        for (let i = 0; i < N - 1; i++) {
          const t = i / (N - 1);
          const a = (1 - t) * 0.5 * vis;
          const r = Math.round(141 + (92 - 141) * t);   // 8D → 5C
          const g = Math.round(146 + (99 - 146) * t);   // 92 → 63
          const b = Math.round(232 + (230 - 232) * t);  // E8 → E6
          ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
          ctx.shadowColor = `rgba(${r},${g},${b},${a})`;
          ctx.lineWidth = (1 - t) * 7 + 0.4;
          const mx = (pts[i].x + pts[i + 1].x) / 2;
          const my = (pts[i].y + pts[i + 1].y) / 2;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
          ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={ref} className="cursor-ribbon" aria-hidden="true" />;
}

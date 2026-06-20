/* Stripe-style hero animations: flux mesh-gradient + constellation field.
   Both are canvas-based, DPR-aware, pause when offscreen, respect reduced-motion. */
(function () {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- FLUX: soft flowing mesh gradient (Stripe hero feel) ---------- */
  function Flux(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext("2d");
    const colors = opts.colors || ["#00E5A3", "#26C6DA", "#0F52FF", "#7C5CFF"];
    const alpha = opts.alpha != null ? opts.alpha : 0.55;
    const speed = opts.speed != null ? opts.speed : 1;
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), t = Math.random() * 1000, raf = 0, vis = true;

    function hex(c) {
      const n = parseInt(c.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const rgb = colors.map(hex);

    function resize() {
      w = canvas.width = Math.max(1, canvas.offsetWidth * dpr);
      h = canvas.height = Math.max(1, canvas.offsetHeight * dpr);
      try { ctx.filter = "blur(" + Math.round(42 * dpr) + "px)"; } catch (e) {}
    }
    function frame() {
      t += 0.0016 * speed;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      for (let i = 0; i < rgb.length; i++) {
        const px = (0.5 + 0.42 * Math.sin(t * (0.7 + i * 0.26) + i * 1.7)) * w;
        const py = (0.5 + 0.42 * Math.cos(t * (0.6 + i * 0.21) + i * 2.3)) * h;
        const r = Math.max(w, h) * (0.55 + 0.12 * Math.sin(t + i));
        const g = ctx.createRadialGradient(px, py, 0, px, py, r);
        const c = rgb[i];
        g.addColorStop(0, "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + alpha + ")");
        g.addColorStop(1, "rgba(" + c[0] + "," + c[1] + "," + c[2] + ",0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      if (vis) raf = requestAnimationFrame(frame);
    }
    resize();
    window.addEventListener("resize", resize);
    if (reduce) { frame(); /* draw one static frame */ }
    else {
      const io = new IntersectionObserver((e) => {
        vis = e[0].isIntersecting;
        if (vis && !raf) raf = requestAnimationFrame(frame);
        else if (!vis) { cancelAnimationFrame(raf); raf = 0; }
      });
      io.observe(canvas);
      raf = requestAnimationFrame(frame);
    }
    return { setColors(cs) { rgb.length = 0; cs.map(hex).forEach((c) => rgb.push(c)); } };
  }

  /* ---------- CONSTELLATION: connected nodes, subtle mouse pull ---------- */
  function Constellation(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), raf = 0, vis = true;
    const color = opts.color || "10,26,47";
    const density = opts.density || 9000; // lower = more dots
    const linkDist = opts.linkDist || 130;
    let pts = [];
    const mouse = { x: -9999, y: -9999 };

    function build() {
      const count = Math.round((canvas.offsetWidth * canvas.offsetHeight) / density);
      pts = [];
      for (let i = 0; i < count; i++) {
        pts.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25 * dpr, vy: (Math.random() - 0.5) * 0.25 * dpr,
          r: (Math.random() * 1.6 + 0.6) * dpr
        });
      }
    }
    function resize() {
      w = canvas.width = Math.max(1, canvas.offsetWidth * dpr);
      h = canvas.height = Math.max(1, canvas.offsetHeight * dpr);
      build();
    }
    const LD = linkDist * dpr;
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dxm = p.x - mouse.x, dym = p.y - mouse.y, dm = Math.hypot(dxm, dym);
        if (dm < 140 * dpr) { p.x += (dxm / dm) * 0.6; p.y += (dym / dm) * 0.6; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fillStyle = "rgba(" + color + ",0.5)"; ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.hypot(dx, dy);
          if (d < LD) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = "rgba(" + color + "," + (0.18 * (1 - d / LD)).toFixed(3) + ")";
            ctx.lineWidth = dpr; ctx.stroke();
          }
        }
      }
      if (vis) raf = requestAnimationFrame(frame);
    }
    resize();
    window.addEventListener("resize", resize);
    const host = opts.mouseTarget || canvas;
    host.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * dpr; mouse.y = (e.clientY - r.top) * dpr;
    });
    host.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
    if (reduce) { frame(); }
    else {
      const io = new IntersectionObserver((e) => {
        vis = e[0].isIntersecting;
        if (vis && !raf) raf = requestAnimationFrame(frame);
        else if (!vis) { cancelAnimationFrame(raf); raf = 0; }
      });
      io.observe(canvas);
      raf = requestAnimationFrame(frame);
    }
    return { setColor(c) { /* color is closure */ } };
  }

  window.FX = { Flux: Flux, Constellation: Constellation, reduce: reduce };
})();

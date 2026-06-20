"use client";
import { useEffect, useRef, useState } from "react";
import { BRAND } from "@/lib/brand";

/* Tabbed node-flow board (n8n / Stripe / Make style): pick a discipline,
   see a left→right pipeline of real tech nodes with pulses flowing on the links. */

type FNode = { id: string; x: number; y: number; icon: string; label: string };
type Flow = { key: string; label: string; sub: string; nodes: FNode[]; links: [string, string][] };

const FLOWS: Flow[] = [
  {
    key: "data", label: "Data Engineering", sub: "Ingest → Model → Serve",
    nodes: [
      { id: "src",  x: 0.06, y: 0.50, icon: "kafka",      label: "Streams" },
      { id: "orch", x: 0.28, y: 0.22, icon: "airflow",    label: "Airflow" },
      { id: "proc", x: 0.28, y: 0.78, icon: "spark",      label: "Spark" },
      { id: "xfrm", x: 0.50, y: 0.50, icon: "dbt",        label: "dbt" },
      { id: "wh",   x: 0.73, y: 0.28, icon: "snowflake",  label: "Snowflake" },
      { id: "db",   x: 0.73, y: 0.74, icon: "postgresql", label: "Postgres" },
      { id: "bi",   x: 0.94, y: 0.50, icon: "grafana",    label: "Dashboards" },
    ],
    links: [["src", "orch"], ["src", "proc"], ["orch", "xfrm"], ["proc", "xfrm"], ["xfrm", "wh"], ["xfrm", "db"], ["wh", "bi"], ["db", "bi"]],
  },
  {
    key: "soft", label: "Software Engineering", sub: "Build → Run → Ship",
    nodes: [
      { id: "git", x: 0.06, y: 0.50, icon: "git",         label: "Git" },
      { id: "api", x: 0.30, y: 0.24, icon: "fastapi",     label: "FastAPI" },
      { id: "svc", x: 0.30, y: 0.76, icon: "nodedotjs",   label: "Node" },
      { id: "ctr", x: 0.52, y: 0.50, icon: "docker",      label: "Docker" },
      { id: "db",  x: 0.74, y: 0.28, icon: "postgresql",  label: "Postgres" },
      { id: "ui",  x: 0.74, y: 0.74, icon: "react",       label: "React" },
      { id: "out", x: 0.94, y: 0.50, icon: "tailwindcss", label: "Product" },
    ],
    links: [["git", "api"], ["git", "svc"], ["api", "ctr"], ["svc", "ctr"], ["ctr", "db"], ["ctr", "ui"], ["db", "out"], ["ui", "out"]],
  },
  {
    key: "devops", label: "DevOps", sub: "Provision → Deploy → Observe",
    nodes: [
      { id: "git",   x: 0.06, y: 0.50, icon: "git",        label: "Git" },
      { id: "ci",    x: 0.28, y: 0.24, icon: "docker",     label: "CI · Build" },
      { id: "iac",   x: 0.28, y: 0.76, icon: "terraform",  label: "Terraform" },
      { id: "cloud", x: 0.52, y: 0.50, icon: "aws",        label: "AWS" },
      { id: "mon",   x: 0.74, y: 0.28, icon: "prometheus", label: "Prometheus" },
      { id: "dash",  x: 0.74, y: 0.74, icon: "grafana",    label: "Grafana" },
      { id: "ok",    x: 0.94, y: 0.50, icon: "linux",      label: "Uptime" },
    ],
    links: [["git", "ci"], ["git", "iac"], ["ci", "cloud"], ["iac", "cloud"], ["cloud", "mon"], ["cloud", "dash"], ["mon", "ok"], ["dash", "ok"]],
  },
];

function NodeIcon({ k, icons }: { k: string; icons: Record<string, string> }) {
  const svg = icons[k] || "";
  return <span className="ni" style={{ color: BRAND[k] }} dangerouslySetInnerHTML={svg ? { __html: svg } : undefined} />;
}

export default function ArchitectureFlow({ icons }: { icons: Record<string, string> }) {
  const [tab, setTab] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flowRef = useRef<Flow>(FLOWS[0]);
  const progRef = useRef(0);
  const pulsesRef = useRef<{ t: number; speed: number }[]>([]);

  // update active flow + reset draw-in when tab changes
  useEffect(() => {
    flowRef.current = FLOWS[tab];
    progRef.current = 0;
    pulsesRef.current = FLOWS[tab].links.map((_, i) => ({ t: -(i * 0.12), speed: 0.006 + (i % 3) * 0.0015 }));
  }, [tab]);

  useEffect(() => {
    const stage = stageRef.current, canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let dpr = 1, raf = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, stage.clientWidth * dpr);
      canvas.height = Math.max(1, stage.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(stage);

    const node = (id: string) => flowRef.current.nodes.find((n) => n.id === id)!;
    const px = (n: FNode) => ({ x: 30 + n.x * (stage.clientWidth - 60), y: 24 + n.y * (stage.clientHeight - 48) });
    const cubic = (a: P, c1: P, c2: P, b: P, t: number): P => {
      const it = 1 - t;
      return {
        x: it * it * it * a.x + 3 * it * it * t * c1.x + 3 * it * t * t * c2.x + t * t * t * b.x,
        y: it * it * it * a.y + 3 * it * it * t * c1.y + 3 * it * t * t * c2.y + t * t * t * b.y,
      };
    };
    type P = { x: number; y: number };

    function draw() {
      const W = stage!.clientWidth, H = stage!.clientHeight;
      ctx.clearRect(0, 0, W, H);
      const flow = flowRef.current;
      const p = Math.min(1, progRef.current);
      const ep = 1 - Math.pow(1 - p, 3); // easeOutCubic

      flow.links.forEach((lk, i) => {
        const a = px(node(lk[0])), b = px(node(lk[1]));
        const dx = (b.x - a.x) * 0.45;
        const c1 = { x: a.x + dx, y: a.y }, c2 = { x: b.x - dx, y: b.y };

        // connector track (drawn in)
        ctx.beginPath();
        const SEG = 40;
        for (let s = 0; s <= SEG; s++) {
          const pt = cubic(a, c1, c2, b, (s / SEG) * ep);
          if (s === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = "rgba(92,99,230,0.28)";
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // flowing pulse
        if (p >= 1 && !reduce) {
          const pl = pulsesRef.current[i];
          if (pl && pl.t >= 0 && pl.t <= 1) {
            const pt = cubic(a, c1, c2, b, pl.t);
            const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 9);
            g.addColorStop(0, "rgba(92,99,230,0.95)");
            g.addColorStop(1, "rgba(92,99,230,0)");
            ctx.beginPath(); ctx.arc(pt.x, pt.y, 9, 0, 6.2832); ctx.fillStyle = g; ctx.fill();
            ctx.beginPath(); ctx.arc(pt.x, pt.y, 2.4, 0, 6.2832); ctx.fillStyle = "rgba(210,213,255,0.95)"; ctx.fill();
          }
          if (pl) { pl.t += pl.speed; if (pl.t > 1.15) pl.t = -0.05; }
        }
      });

      if (progRef.current < 1) progRef.current += 0.02;
      raf = requestAnimationFrame(draw);
    }
    if (reduce) { progRef.current = 1; draw(); cancelAnimationFrame(raf); }
    else raf = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <div className="arch-panel rv">
      <div className="arch-tabs">
        {FLOWS.map((f, i) => (
          <button key={f.key} className={`arch-tab ${i === tab ? "on" : ""}`} onClick={() => setTab(i)}>
            <span className="d" /><span>{f.label}</span>
            <span className="sub">{f.sub}</span>
          </button>
        ))}
      </div>
      <div className="arch-scroll">
        <div className="arch-stage" ref={stageRef}>
          <canvas ref={canvasRef} aria-hidden="true" />
          {FLOWS[tab].nodes.map((n, i) => (
            <div
              key={`${tab}-${n.id}`}
              className="arch-node"
              style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%`, animationDelay: `${i * 55}ms` }}
            >
              <span className="tile"><NodeIcon k={n.icon} icons={icons} /></span>
              <span className="lbl">{n.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

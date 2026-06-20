"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/* n8n-style workflow editor: a discipline rail + a node-flow strip
   (trigger → Code node → output) over a dark dot-grid canvas, with the
   active "Code" node expanded into a live-typing, syntax-highlighted panel.
   Three disciplines: Software · Data · AI Automation. */

type Tok = { t: string; c?: string };
type Glyph = "trigger" | "code" | "send" | "db" | "ai" | "box";
type FNode = { icon: Glyph; label: string; sub: string; active?: boolean };
type Disc = { key: string; rail: string; sub: string; node: string; lang: string; flow: FNode[]; lines: Tok[][] };

const K = "kw", S = "str", C = "com", F = "fn", N = "num", T = "typ";

const DISCIPLINES: Disc[] = [
  {
    key: "soft", rail: "Software Engineering", sub: "APIs · services · types", node: "subscribe.ts", lang: "TypeScript",
    flow: [
      { icon: "trigger", label: "Webhook", sub: "POST /subscribe" },
      { icon: "code", label: "Code", sub: "TypeScript", active: true },
      { icon: "send", label: "Respond", sub: "201 Created" },
    ],
    lines: [
      [{ t: "import", c: K }, { t: " { Router } " }, { t: "from", c: K }, { t: " " }, { t: '"express"', c: S }],
      [{ t: "import", c: K }, { t: " { z } " }, { t: "from", c: K }, { t: " " }, { t: '"zod"', c: S }],
      [],
      [{ t: "const", c: K }, { t: " Body = z." }, { t: "object", c: F }, { t: "({ email: z." }, { t: "string", c: F }, { t: "()." }, { t: "email", c: F }, { t: "() })" }],
      [],
      [{ t: "router." }, { t: "post", c: F }, { t: "(" }, { t: '"/subscribe"', c: S }, { t: ", " }, { t: "async", c: K }, { t: " (req, res) => {" }],
      [{ t: "  " }, { t: "const", c: K }, { t: " { email } = Body." }, { t: "parse", c: F }, { t: "(req.body)" }, { t: "   // validate", c: C }],
      [{ t: "  " }, { t: "await", c: K }, { t: " db.users." }, { t: "upsert", c: F }, { t: "({ email })" }],
      [{ t: "  " }, { t: "return", c: K }, { t: " res." }, { t: "status", c: F }, { t: "(" }, { t: "201", c: N }, { t: ")." }, { t: "json", c: F }, { t: "({ ok: " }, { t: "true", c: N }, { t: " })" }],
      [{ t: "})" }],
    ],
  },
  {
    key: "data", rail: "Data Engineering", sub: "pipelines · warehouses", node: "pipeline.py", lang: "Python",
    flow: [
      { icon: "db", label: "Kafka", sub: "events stream" },
      { icon: "code", label: "Code", sub: "Python", active: true },
      { icon: "box", label: "Warehouse", sub: "Snowflake" },
    ],
    lines: [
      [{ t: "from", c: K }, { t: " airflow " }, { t: "import", c: K }, { t: " DAG" }],
      [{ t: "from", c: K }, { t: " airflow.operators.python " }, { t: "import", c: K }, { t: " PythonOperator" }],
      [],
      [{ t: "with", c: K }, { t: " " }, { t: "DAG", c: F }, { t: "(" }, { t: '"daily_revenue"', c: S }, { t: ", schedule=" }, { t: '"@daily"', c: S }, { t: ") " }, { t: "as", c: K }, { t: " dag:" }],
      [{ t: "    " }, { t: "def", c: K }, { t: " " }, { t: "transform", c: F }, { t: "():" }],
      [{ t: "        df = " }, { t: "read_stream", c: F }, { t: "(" }, { t: '"events"', c: S }, { t: ")" }, { t: "   # Kafka → Spark", c: C }],
      [{ t: "        " }, { t: "return", c: K }, { t: " df." }, { t: "dropna", c: F }, { t: "()." }, { t: "to_warehouse", c: F }, { t: "(" }, { t: '"snowflake"', c: S }, { t: ")" }],
      [],
      [{ t: "    " }, { t: "PythonOperator", c: F }, { t: "(task_id=" }, { t: '"transform"', c: S }, { t: ", python_callable=transform)" }],
    ],
  },
  {
    key: "ai", rail: "AI Automation", sub: "agents · tool-use", node: "agent.py", lang: "Python",
    flow: [
      { icon: "trigger", label: "Trigger", sub: "new ticket" },
      { icon: "ai", label: "AI Agent", sub: "Claude · tools", active: true },
      { icon: "send", label: "Tool Call", sub: "auto-route" },
    ],
    lines: [
      [{ t: "from", c: K }, { t: " anthropic " }, { t: "import", c: K }, { t: " Anthropic" }],
      [],
      [{ t: "client = " }, { t: "Anthropic", c: F }, { t: "()" }],
      [],
      [{ t: "def", c: K }, { t: " " }, { t: "triage", c: F }, { t: "(ticket: " }, { t: "str", c: T }, { t: ") -> " }, { t: "dict", c: T }, { t: ":" }],
      [{ t: "    resp = client.messages." }, { t: "create", c: F }, { t: "(" }],
      [{ t: "        model=" }, { t: '"claude-opus-4-8"', c: S }, { t: ", tools=TOOLS," }],
      [{ t: "        messages=[{" }, { t: '"role"', c: S }, { t: ": " }, { t: '"user"', c: S }, { t: ", " }, { t: '"content"', c: S }, { t: ": ticket}]," }],
      [{ t: "    )" }],
      [{ t: "    " }, { t: "for", c: K }, { t: " block " }, { t: "in", c: K }, { t: " resp.content:" }],
      [{ t: "        " }, { t: "if", c: K }, { t: " block.type == " }, { t: '"tool_use"', c: S }, { t: ":" }],
      [{ t: "            " }, { t: "return", c: K }, { t: " " }, { t: "dispatch", c: F }, { t: "(block.name, block.input)" }],
    ],
  },
];

function Glyph({ k }: { k: Glyph }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (k) {
    case "trigger": return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3 L5 14 H11 L10 21 L19 9 H13 Z" {...p} /></svg>;
    case "code":    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 8 L5 12 L9 16 M15 8 L19 12 L15 16" {...p} /></svg>;
    case "send":    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3 L3 10.5 L10 13 L12.5 20 Z M10 13 L21 3" {...p} /></svg>;
    case "db":      return <svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="6" rx="7" ry="3" {...p} /><path d="M5 6 V18 C5 19.7 8 21 12 21 C16 21 19 19.7 19 18 V6" {...p} /></svg>;
    case "ai":      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L14 9.5 L20.5 12 L14 14.5 L12 21 L10 14.5 L3.5 12 L10 9.5 Z" {...p} /></svg>;
    case "box":     return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L20 7 V17 L12 21 L4 17 V7 Z M4 7 L12 11 L20 7 M12 11 V21" {...p} /></svg>;
  }
}

export default function CodeWindow() {
  const [tab, setTab] = useState(1); // default to Data Engineering
  const [typed, setTyped] = useState(0);
  const [seen, setSeen] = useState(false);
  const [reduce, setReduce] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const disc = DISCIPLINES[tab];
  const total = useMemo(
    () => disc.lines.reduce((n, l) => n + l.reduce((m, tk) => m + tk.t.length, 0), 0),
    [disc]
  );

  useEffect(() => { setReduce(!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches); }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => { if (es[0].isIntersecting) { setSeen(true); io.disconnect(); } },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduce) { setTyped(total); return; }
    if (!seen) { setTyped(0); return; }
    setTyped(0);
    const dur = Math.min(2600, 650 + total * 7);
    let startT = 0, raf = 0;
    const step = (now: number) => {
      if (!startT) startT = now;
      const p = Math.min(1, (now - startT) / dur);
      setTyped(Math.round(total * p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [tab, seen, total, reduce]);

  const done = typed >= total;
  let acc = 0, caretLi = 0;
  for (let i = 0; i < disc.lines.length; i++) {
    const len = disc.lines[i].reduce((m, tk) => m + tk.t.length, 0);
    caretLi = i;
    if (typed <= acc + len) break;
    acc += len;
  }
  let consumed = 0;

  return (
    <div className="n8n rv" ref={wrapRef}>
      {/* left rail — disciplines */}
      <div className="n8n-rail">
        <div className="n8n-rail-h">Workflows</div>
        {DISCIPLINES.map((d, i) => (
          <button key={d.key} className={`n8n-disc ${i === tab ? "on" : ""}`} onClick={() => setTab(i)}>
            <span className="dot" />
            <span className="t"><b>{d.rail}</b><em>{d.sub}</em></span>
          </button>
        ))}
      </div>

      {/* canvas — node-flow + code node */}
      <div className="n8n-canvas">
        <div className="n8n-flow" key={disc.key}>
          {disc.flow.map((n, i) => (
            <div key={n.label} className="n8n-cell">
              <div className={`n8n-node ${n.active ? "on" : ""} g-${n.icon}`}>
                <span className="port l" /><span className="port r" />
                <span className="ic"><Glyph k={n.icon} /></span>
                <span className="nm"><b>{n.label}</b><em>{n.sub}</em></span>
              </div>
              {i < disc.flow.length - 1 && <span className="n8n-wire"><i className="pulse" /></span>}
            </div>
          ))}
        </div>

        {/* the active Code node, expanded */}
        <div className="n8n-code">
          <div className="n8n-code-bar">
            <span className="ic"><Glyph k={disc.flow[1].icon} /></span>
            <span className="title">{disc.node}</span>
            <span className="lang">{disc.lang}</span>
          </div>
          <pre>
            <code>
              {disc.lines.map((line, li) => {
                const cells: ReactNode[] = [];
                for (let ti = 0; ti < line.length; ti++) {
                  const tk = line[ti];
                  const showN = Math.min(tk.t.length, Math.max(0, typed - consumed));
                  if (showN > 0) cells.push(<span key={ti} className={tk.c ? `tok-${tk.c}` : undefined}>{tk.t.slice(0, showN)}</span>);
                  consumed += tk.t.length;
                }
                const showCaret = !reduce && li === caretLi;
                return (
                  <div className="code-row" key={li}>
                    <span className="code-ln">{li + 1}</span>
                    <span className="code-content">
                      {cells.length === 0 && line.length === 0 ? " " : cells}
                      {showCaret && <span className={`code-caret ${done ? "blink" : ""}`} aria-hidden="true" />}
                    </span>
                  </div>
                );
              })}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

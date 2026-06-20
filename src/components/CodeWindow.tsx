"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/* macOS-style window with syntax-highlighted code (n8n / Vercel "code when you need it" vibe).
   Tokens are pre-tagged so the highlight is crisp and dependency-free.
   The active file LIVE-TYPES itself when scrolled into view and re-types on tab switch. */

type Tok = { t: string; c?: string };
type Snippet = { name: string; lang: string; lines: Tok[][] };

const K = "kw", S = "str", C = "com", F = "fn", N = "num", T = "typ";

const SNIPPETS: Snippet[] = [
  {
    name: "pipeline.py", lang: "Airflow",
    lines: [
      [{ t: "from", c: K }, { t: " airflow " }, { t: "import", c: K }, { t: " DAG" }],
      [{ t: "from", c: K }, { t: " airflow.operators.python " }, { t: "import", c: K }, { t: " PythonOperator" }],
      [],
      [{ t: "with", c: K }, { t: " " }, { t: "DAG", c: F }, { t: "(" }, { t: '"daily_revenue"', c: S }, { t: ", schedule=" }, { t: '"@daily"', c: S }, { t: ") " }, { t: "as", c: K }, { t: " dag:" }],
      [],
      [{ t: "    " }, { t: "def", c: K }, { t: " " }, { t: "transform", c: F }, { t: "():" }],
      [{ t: "        df = " }, { t: "read_stream", c: F }, { t: "(" }, { t: '"events"', c: S }, { t: ")" }, { t: "        # Kafka → Spark", c: C }],
      [{ t: "        " }, { t: "return", c: K }, { t: " df." }, { t: "dropna", c: F }, { t: "()." }, { t: "to_warehouse", c: F }, { t: "(" }, { t: '"snowflake"', c: S }, { t: ")" }],
      [],
      [{ t: "    " }, { t: "PythonOperator", c: F }, { t: "(task_id=" }, { t: '"transform"', c: S }, { t: ", python_callable=transform)" }],
    ],
  },
  {
    name: "revenue.sql", lang: "dbt",
    lines: [
      [{ t: "-- models/marts/revenue.sql", c: C }],
      [{ t: "{{ " }, { t: "config", c: F }, { t: "(materialized=" }, { t: '"incremental"', c: S }, { t: ") }}" }],
      [],
      [{ t: "select", c: K }],
      [{ t: "    " }, { t: "date_trunc", c: F }, { t: "(" }, { t: "'day'", c: S }, { t: ", event_ts) " }, { t: "as", c: K }, { t: " day," }],
      [{ t: "    " }, { t: "count", c: F }, { t: "(*)" }, { t: "          " }, { t: "as", c: K }, { t: " events," }],
      [{ t: "    " }, { t: "sum", c: F }, { t: "(amount)" }, { t: "       " }, { t: "as", c: K }, { t: " revenue" }],
      [{ t: "from", c: K }, { t: " {{ " }, { t: "ref", c: F }, { t: "(" }, { t: "'stg_events'", c: S }, { t: ") }}" }],
      [{ t: "where", c: K }, { t: " status = " }, { t: "'paid'", c: S }],
      [{ t: "group by", c: K }, { t: " " }, { t: "1", c: N }],
    ],
  },
  {
    name: "main.tf", lang: "Terraform",
    lines: [
      [{ t: "resource", c: K }, { t: " " }, { t: '"aws_ecs_service"', c: S }, { t: " " }, { t: '"api"', c: S }, { t: " {" }],
      [{ t: "  name          = " }, { t: '"data-api"', c: S }],
      [{ t: "  cluster       = aws_ecs_cluster.main.id" }],
      [{ t: "  desired_count = " }, { t: "3", c: N }],
      [{ t: "  launch_type   = " }, { t: '"FARGATE"', c: S }],
      [],
      [{ t: "  " }, { t: "deployment_circuit_breaker", c: T }, { t: " {" }],
      [{ t: "    enable   = " }, { t: "true", c: N }],
      [{ t: "    rollback = " }, { t: "true", c: N }],
      [{ t: "  }" }],
      [{ t: "}" }],
    ],
  },
];

export default function CodeWindow() {
  const [tab, setTab] = useState(0);
  const [typed, setTyped] = useState(0);
  const [seen, setSeen] = useState(false);
  const [reduce, setReduce] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const snip = SNIPPETS[tab];
  const total = useMemo(
    () => snip.lines.reduce((n, l) => n + l.reduce((m, tk) => m + tk.t.length, 0), 0),
    [snip]
  );

  // detect reduced-motion once
  useEffect(() => {
    setReduce(!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // begin typing the first time the window scrolls into view
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => { if (es[0].isIntersecting) { setSeen(true); io.disconnect(); } },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // type out the active file (restart on tab switch); reduced-motion → show it all at once
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

  // which line is the caret currently on?
  let acc = 0, caretLi = 0;
  for (let i = 0; i < snip.lines.length; i++) {
    const len = snip.lines[i].reduce((m, tk) => m + tk.t.length, 0);
    caretLi = i;
    if (typed <= acc + len) break;
    acc += len;
  }

  let consumed = 0;

  return (
    <div className="codewin rv" ref={wrapRef}>
      <div className="codewin-bar">
        <span className="codewin-dots"><i className="dot-r" /><i className="dot-y" /><i className="dot-g" /></span>
        <div className="codewin-tabs">
          {SNIPPETS.map((s, i) => (
            <button key={s.name} className={`codewin-tab ${i === tab ? "on" : ""}`} onClick={() => setTab(i)}>
              {s.name}
            </button>
          ))}
        </div>
        <span className="codewin-lang">{snip.lang}</span>
      </div>
      <pre>
        <code>
          {snip.lines.map((line, li) => {
            const cells: ReactNode[] = [];
            for (let ti = 0; ti < line.length; ti++) {
              const tk = line[ti];
              const showN = Math.min(tk.t.length, Math.max(0, typed - consumed));
              if (showN > 0) {
                cells.push(
                  <span key={ti} className={tk.c ? `tok-${tk.c}` : undefined}>{tk.t.slice(0, showN)}</span>
                );
              }
              consumed += tk.t.length;
            }
            const showCaret = !reduce && li === caretLi;
            return (
              <div className="code-row" key={li}>
                <span className="code-ln">{li + 1}</span>
                <span className="code-content">
                  {cells.length === 0 && line.length === 0 ? " " : cells}
                  {showCaret && <span className={`code-caret ${done ? "blink" : ""}`} aria-hidden="true" />}
                </span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

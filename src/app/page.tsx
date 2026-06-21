"use client";
import { useEffect, useRef, useState } from "react";
import Lenis from "@studio-freight/lenis";
import { DATA } from "@/lib/data";
import LiquidHero from "@/components/LiquidHero";
import ArchitectureFlow from "@/components/ArchitectureFlow";
import CodeWindow from "@/components/CodeWindow";
import HowIWork from "@/components/HowIWork";
import Constellation from "@/components/Constellation";
import Globe from "@/components/Globe";
import ProjectShots from "@/components/ProjectShots";
import { BRAND } from "@/lib/brand";

declare global {
  interface Window { ICONS: Record<string, string>; }
}

function useIcons() {
  const [icons, setIcons] = useState<Record<string, string>>({});
  useEffect(() => {
    const poll = () => {
      if (window.ICONS) { setIcons(window.ICONS); return; }
      setTimeout(poll, 80);
    };
    poll();
  }, []);
  return icons;
}

function Ic({ k, size = 26, icons }: { k: string; size?: number; icons: Record<string, string> }) {
  const svg = icons[k] || "";
  return (
    <span
      style={{ width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: BRAND[k] }}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

export default function Page() {
  const navRef = useRef<HTMLElement>(null);
  const icons = useIcons();

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const fn = () => nav.classList.toggle("solid", window.scrollY > 40);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    // Scroll-reveal FIRST and on its own, so content can never stay hidden
    // even if anything else (Lenis, WebGL) fails to initialize.
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const p = en.target.parentElement;
        const sibs = p ? Array.from(p.querySelectorAll<HTMLElement>(".rv")) : [];
        const i = Math.max(0, sibs.indexOf(en.target as HTMLElement));
        (en.target as HTMLElement).style.transitionDelay = `${(i % 6) * 65}ms`;
        en.target.classList.add("in");
        io.unobserve(en.target);
      }),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".rv").forEach((el) => io.observe(el));
    // Failsafe: anything still hidden after 2.5s is force-revealed.
    const failsafe = window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>(".rv:not(.in)").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add("in");
      });
    }, 2500);

    // Lenis smooth scroll — guarded so a failure can't break the page
    let lenis: Lenis | null = null;
    let go = true;
    try {
      lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
      const raf = (t: number) => { if (go && lenis) { lenis.raf(t); requestAnimationFrame(raf); } };
      requestAnimationFrame(raf);
    } catch { lenis = null; }

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href")!;
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el as HTMLElement, { offset: -70, duration: 1.1 });
      else el.scrollIntoView({ behavior: "smooth" });
    };
    document.addEventListener("click", onClick);

    return () => {
      go = false; window.clearTimeout(failsafe);
      lenis?.destroy(); io.disconnect();
      document.removeEventListener("click", onClick);
    };
  }, []);

  // ── Tier-1 micro-interactions: magnetic buttons · count-up stats · scroll-spy nav ──
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];

    // (1) magnetic buttons — translate toward cursor, spring back on leave
    if (!reduce) {
      document.querySelectorAll<HTMLElement>(".magnetic").forEach((el) => {
        const move = (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          const x = e.clientX - (r.left + r.width / 2);
          const y = e.clientY - (r.top + r.height / 2);
          el.style.transform = `translate(${x * 0.28}px, ${y * 0.4}px)`;
        };
        const leave = () => { el.style.transform = ""; };
        el.addEventListener("mousemove", move);
        el.addEventListener("mouseleave", leave);
        cleanups.push(() => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", leave); });
      });
    }

    // (1b) card tilt + cursor spotlight — buttery 3D hover on chips & project cards.
    // Sets --mx/--my (px within card) for the spotlight, and a perspective tilt
    // toward the cursor. Resets on leave so the CSS reveal/hover takes back over.
    if (!reduce) {
      const tilt = (el: HTMLElement, maxDeg: number, lift: number) => {
        const move = (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          el.style.setProperty("--mx", `${e.clientX - r.left}px`);
          el.style.setProperty("--my", `${e.clientY - r.top}px`);
          el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * maxDeg}deg) rotateY(${(px - 0.5) * maxDeg}deg) translateY(${lift}px)`;
        };
        const leave = () => { el.style.transform = ""; };
        el.addEventListener("mousemove", move);
        el.addEventListener("mouseleave", leave);
        cleanups.push(() => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", leave); });
      };
      document.querySelectorAll<HTMLElement>(".chip").forEach((el) => tilt(el, 8, -6));
      document.querySelectorAll<HTMLElement>(".proj:not(.coming)").forEach((el) => tilt(el, 4.5, -6));
      document.querySelectorAll<HTMLElement>(".srv").forEach((el) => tilt(el, 4, -5));
    }

    // (2) count-up stats — tween 0→target once the strip scrolls into view
    const band = document.querySelector(".statband");
    if (band) {
      const run = () => {
        band.querySelectorAll<HTMLElement>(".v[data-to]").forEach((el) => {
          const to = parseFloat(el.dataset.to || "0");
          if (reduce) { el.textContent = String(to); return; }
          const dur = 1400, t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - t0) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = String(Math.round(to * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      };
      const sio = new IntersectionObserver((es) => {
        if (es[0].isIntersecting) { run(); sio.disconnect(); }
      }, { threshold: 0.4 });
      sio.observe(band);
      cleanups.push(() => sio.disconnect());
    }

    // (3) scroll-spy — highlight the nav link for whichever section is near viewport center
    const links = new Map<string, HTMLElement>();
    document.querySelectorAll<HTMLAnchorElement>('.nav-links a[href^="#"]:not(.btn)').forEach((a) => {
      links.set(a.getAttribute("href")!.slice(1), a);
    });
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const id = (en.target as HTMLElement).id;
        if (en.isIntersecting && links.has(id)) {
          links.forEach((a) => a.classList.remove("active"));
          links.get(id)!.classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    ["stack", "about", "architecture", "services", "work"].forEach((id) => {
      const s = document.getElementById(id);
      if (s) spy.observe(s);
    });
    cleanups.push(() => spy.disconnect());

    return () => cleanups.forEach((c) => c());
  }, []);

  const ic = (k: string, size = 26) => <Ic k={k} size={size} icons={icons} />;

  // Make-style isometric scenario board: 3 app bubbles + curved connectors + flowing orbs
  const board = (cls: string, delay: string, k: [string, string, string]) => (
    <div className={`iso-board ${cls}`} style={{ animationDelay: delay }}>
      <div className="iso-inner"><div className="iso-face">
        <svg className="iso-links" viewBox="0 0 150 150" aria-hidden="true">
          <path d="M40 42 Q 75 24 110 42" />
          <path d="M110 42 Q 96 78 75 108" />
        </svg>
        <span className="iso-node a">{ic(k[0], 18)}</span>
        <span className="iso-node b">{ic(k[1], 18)}</span>
        <span className="iso-node c">{ic(k[2], 18)}</span>
        <i className="orb o1" /><i className="orb o2" />
      </div></div>
    </div>
  );

  return (
    <>
      <div className="grain" />

      {/* ── NAV ── */}
      <nav className="nav" ref={navRef}>
        <a className="nav-brand" href="#top">
          <span className="dot" />Zack<span className="role">Data Engineer</span>
        </a>
        <div className="nav-links">
          <a href="#stack">Stack</a>
          <a href="#about">About</a>
          <a href="#architecture">Architecture</a>
          <a href="#services">Services</a>
          <a href="#work">Work</a>
          <a href="#contact" className="btn btn-grad magnetic">Let&apos;s build →</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero" id="top">
        <LiquidHero />
        <div className="hero-veil" />
        <div className="wrap">
          {/* left — text (staggered entrance) */}
          <div className="hero-text">
            <div className="badge e" style={{ animationDelay: ".15s" }}><span className="led" />System Core · Data &amp; AI</div>
            <h1 className="disp e" style={{ animationDelay: ".28s" }}>
              Data &amp; Software<br />
              <span className="accent">Engineer</span>
              <span className="l3"><span className="amp">&amp;</span> AI Automation</span>
            </h1>
            <p className="sub e" style={{ animationDelay: ".46s" }}>
              Pipelines, warehouses, and the rigorous plumbing that makes data trustworthy at scale —
              and the intelligence that acts on it.
            </p>
            <div className="cta e" style={{ animationDelay: ".6s" }}>
              <a className="btn btn-grad magnetic" href="#contact">Let&apos;s build →</a>
              <a className="btn btn-ghost magnetic" href="#work">View my work</a>
            </div>
          </div>

          {/* right — Make-style scene: isometric node boards + portrait that spawns in */}
          <div className="hero-visual">
            <div className="iso-cluster">
              {/* four scenario boards build in… */}
              {board("b1", ".2s", ["kafka", "spark", "airflow"])}
              {board("b2", ".4s", ["dbt", "snowflake", "postgresql"])}
              {board("b3", ".6s", ["docker", "terraform", "aws"])}
              {board("b4", ".8s", ["fastapi", "react", "git"])}

              {/* …then connect together (Make scene): inter-board links + flowing orbs */}
              <svg className="iso-net" viewBox="0 0 420 380" aria-hidden="true">
                <path className="net-link l1" d="M83 75 Q 210 56 337 89" />
                <path className="net-link l2" d="M337 89 Q 360 190 330 289" />
                <path className="net-link l3" d="M330 289 Q 211 320 93 303" />
                <path className="net-link l4" d="M93 303 Q 66 189 83 75" />
              </svg>
              <i className="net-orb n1" /><i className="net-orb n2" /><i className="net-orb n3" /><i className="net-orb n4" />

              {/* build-up, then the photo lands in place at the very end */}
              <div className="spawn-fx" aria-hidden="true">
                <span className="spawn-ring r1" />
                <span className="spawn-ring r2" />
                <span className="spawn-dot d1" /><span className="spawn-dot d2" /><span className="spawn-dot d3" />
                <span className="spawn-dot d4" /><span className="spawn-dot d5" /><span className="spawn-dot d6" />
              </div>
              <div className="idcard spawn">
                <div className="blob" />
                <div className="gridlines" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="portrait" src="/portrait.jpeg" alt="Zakaria Alizouaoui" />
                <div className="idnode"><span>&lt;</span><span>&gt;</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="scrollcue" aria-hidden="true">
          <span>scroll</span>
          <span className="bar" />
        </div>
      </section>

      {/* ── MARQUEE — moving tech band ── */}
      <div className="marquee" aria-hidden="true">
        <div className="track">
          {[...DATA.stack, ...DATA.stack].map((s, i) => (
            <div key={`${s.name}-${i}`} className="it">
              {ic(s.icon, 26)}
              <span className="lbl">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── BY THE NUMBERS — count-up strip ── */}
      <div className="statband rv">
        <div className="stat"><div className="num"><span className="v" data-to="16">0</span><span className="u">M+</span></div><div className="lbl">Records / day</div></div>
        <div className="stat"><div className="num"><span className="v" data-to="8">0</span></div><div className="lbl">Dashboards shipped</div></div>
        <div className="stat"><div className="num"><span className="v" data-to="12">0</span><span className="u">+</span></div><div className="lbl">Technologies</div></div>
        <div className="stat"><div className="num"><span className="v" data-to="4">0</span></div><div className="lbl">Internships</div></div>
      </div>

      {/* ── STACK ── */}
      <section className="pad section-stack" id="stack">
        <div className="seclabel rv">The Toolkit</div>
        <h2 className="sectitle disp rv">One dependable workflow, end&nbsp;to&nbsp;end.</h2>
        <p className="lead rv">
          Everything I reach for to take raw events all the way to decisions — built, tuned, and accounted for.
        </p>
        <div className="stackgrid">
          {DATA.stack.map((s) => (
            <div key={s.name} className="chip rv">
              <div className="ic">{ic(s.icon, 34)}</div>
              <div>
                <div className="nm">{s.name}</div>
                <div className="ct">{s.cat}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="pad about-sec" id="about">
        <div className="about-grid">
          <div className="about-lead">
            <div className="seclabel rv">About</div>
            <h2 className="bighead disp about-head rv" aria-label="I make data behave.">
              <span className="ln"><span>I make data</span></span>
              <span className="ln"><span>behave<span className="accent">.</span></span></span>
            </h2>
            <p className="abody rv">{DATA.about.body}</p>
          </div>
          <ul className="principles rv" aria-label="How I work">
            <span className="prail" aria-hidden="true" />
            <li className="pr rv">
              <span className="pnode" aria-hidden="true" />
              <div><b>Pipelines that don&apos;t break</b><em>Resilient batch &amp; streaming ingestion, watched and alerted.</em></div>
            </li>
            <li className="pr rv">
              <span className="pnode" aria-hidden="true" />
              <div><b>Models you can trust</b><em>Tested, layered warehouses with lineage you can audit.</em></div>
            </li>
            <li className="pr rv">
              <span className="pnode" aria-hidden="true" />
              <div><b>Docs future-you will thank you for</b><em>Context that outlives me — so the system keeps running.</em></div>
            </li>
          </ul>
        </div>
      </section>

      {/* ── HOW I WORK (pinned scroll story) ── */}
      <HowIWork />

      {/* ── JOURNEY (glassy-coin timeline) ── */}
      <section className="pad section-stack" id="journey">
        <div className="seclabel rv">The Journey</div>
        <h2 className="sectitle disp rv">From software, to data, <span className="accent">to AI.</span></h2>
        <p className="lead rv">
          From building software to engineering data — and now the AI &amp; automation layer on top.
          Full-time at Dusens Research, and open to select freelance work.
        </p>
        <div className="htimeline rv">
          <div className="htinner">
            <div className="htrack">
              {DATA.timeline.map((t) => (
                <div key={t.org} className={`hstop ${t.current ? "is-now" : ""}`}>
                  <div className="coin-wrap">
                    <div className={`coin ${t.current ? "now" : ""}`}>
                      {t.logo
                        ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={t.logo} alt={t.org} />)
                        : <span className="mono2">{t.mono}</span>}
                    </div>
                    {t.current && (
                      <span className="sparkles" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
                    )}
                  </div>
                  <div className="hname">{t.org}</div>
                  <div className="hyear">{t.period}</div>
                  <div className="hkind">
                    {t.role.replace(/\s*Intern(ship)?$/i, "")} ·{" "}
                    {t.current ? <span className="ft">Full-time · Freelance</span> : "Internship"}
                  </div>
                </div>
              ))}
            </div>
            <div className="hline" aria-hidden="true">
              <span className="comet" />
              <span className="terminus" />
            </div>
          </div>
        </div>
      </section>

      {/* ── BASED IN ALGIERS (globe) ── */}
      <section className="pad" id="based" style={{ paddingTop: 0 }}>
        <div className="globe-panel rv">
          <div className="globe-copy">
            <div className="seclabel">Based in Algiers</div>
            <h2 className="disp">I&apos;m from <span className="accent">Algiers.</span></h2>
            <p>
              I architect systems that gather scattered data from sources all over the map —
              and bring it home: clean, modeled, and trustworthy.
            </p>
            <span className="coords"><span className="pin" />Freelancer · Algiers, Algeria</span>
          </div>
          <div className="globe-stage">
            <span className="globe-glow" aria-hidden="true" />
            <Globe />
            <span className="globe-tag"><span className="pin" />Algiers</span>
          </div>
        </div>
      </section>

      {/* ── ARCHITECTURE (tabbed node flow) ── */}
      <section className="pad section-stack" id="architecture">
        <div className="seclabel rv">The Architecture</div>
        <h2 className="sectitle disp rv">From raw event to <span className="accent">autonomous action.</span></h2>
        <p className="lead rv">
          One system across three disciplines — pick a layer and watch the data move through it,
          node by node.
        </p>
        <ArchitectureFlow icons={icons} />
      </section>

      {/* ── CODE WINDOW ── */}
      <section className="pad" id="code" style={{ paddingTop: 0 }}>
        <div className="seclabel rv">Under the hood</div>
        <h2 className="sectitle disp rv">Code when it <span className="accent">counts.</span></h2>
        <p className="lead rv">
          Pick a discipline and read the real thing — typed services, data pipelines, and AI agents,
          wired up like the workflows I automate.
        </p>
        <CodeWindow />
      </section>

      {/* ── SERVICES ── */}
      <section className="pad services" id="services">
        <Constellation color="92,99,230" density={9000} linkDist={132} />
        <div className="seclabel rv">What I offer</div>
        <h2 className="sectitle disp rv">Hire me for the hard, dependable parts.</h2>
        <p className="lead rv">
          From first event to final dashboard — and the automation that keeps it all running.
        </p>
        <div className="srvgrid">
          {DATA.services.map((s) => (
            <div key={s.title} className="srv rv">
              <div className="ic">{ic(s.icon, 44)}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROJECTS ── */}
      <section className="pad" id="work">
        <div className="seclabel rv">Selected Work</div>
        <h2 className="sectitle disp rv">Real systems, <span className="accent">shipped.</span></h2>
        <p className="lead rv">
          Pulled straight from my GitHub — architecture, dashboards and models I built end to end.
        </p>
        <div className="projgrid">
          {DATA.projects.map((p, i) => {
            const cls = p.featured ? "feat" : i === 1 ? "half" : "";
            return (
              <a key={p.name} className={`proj ${cls} rv`} href={p.repo} target="_blank" rel="noopener noreferrer">
                <div className="shot">
                  <span className="kind">{p.kind}</span>
                  <ProjectShots shots={p.shots} alt={`${p.name} — screenshot`} />
                </div>
                <div className="meta">
                  <div className="tag">{p.tag}</div>
                  <h3>{p.name}</h3>
                  <p>{p.desc}</p>
                  <span className="go">View on GitHub <Arrow /></span>
                </div>
              </a>
            );
          })}
          <div className="proj coming rv">
            <span className="dots" aria-hidden="true"><i /><i /><i /></span>
            <h3>More, in the making.</h3>
            <p>New data platforms and AI automation studies are taking shape — the good ones are worth the wait.</p>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="pad contact" id="contact">
        <div className="card rv">
          <span className="c-aurora" aria-hidden="true" />
          <span className="c-grid" aria-hidden="true" />
          <div className="inner">
            <div className="c-left">
              <span className="c-avail"><span className="led" />Available · {DATA.location}</span>
              <h2 className="ctabig disp">Let&apos;s <span className="acc">build.</span></h2>
              <p className="c-lead">
                Open to select freelance data engineering &amp; AI automation work —
                pipelines, warehouses, and the automation that runs on top.
              </p>
            </div>
            <div className="c-actions">
              <a className="c-mail magnetic" href={`mailto:${DATA.email}`}>
                <span className="c-mail-ic">{ic("gmail", 22)}</span>
                <span className="c-mail-t"><b>Email me</b><em>{DATA.email}</em></span>
                <span className="c-arrow"><Arrow /></span>
              </a>
              <div className="c-socials">
                <a className="c-soc" href={DATA.socials.linkedin} target="_blank" rel="noopener noreferrer">{ic("linkedin", 20)}<span>LinkedIn</span></a>
                <a className="c-soc" href={DATA.socials.github} target="_blank" rel="noopener noreferrer">{ic("github", 20)}<span>GitHub</span></a>
              </div>
              <span className="c-note">Typically replies within a day.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="foot-row">
          <a className="foot-brand" href="#top"><span className="dot" />Zack</a>
          <a className="foot-up" href="#top">Back to top <span aria-hidden="true">↑</span></a>
        </div>
        <div className="foot-row foot-main">
          <div className="copy">
            © 2026 — <strong>{DATA.fullName}</strong><br />
            Data Engineer &amp; AI Specialist · {DATA.location}
          </div>
          <a className="foot-mail" href={`mailto:${DATA.email}`}>{DATA.email}</a>
          <div className="soc">
            <a href={DATA.socials.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">{ic("linkedin", 18)}</a>
            <a href={DATA.socials.github}   target="_blank" rel="noopener noreferrer" aria-label="GitHub">{ic("github", 18)}</a>
            <a href={`mailto:${DATA.email}`} aria-label="Email">{ic("gmail", 18)}</a>
          </div>
        </div>
      </footer>
    </>
  );
}

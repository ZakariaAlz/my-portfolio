"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/* GPU particle globe: continents (sampled from /textures/earth-map.png) drawn as
   small bright points in a custom shader — traveling waves + magnetic cursor bulge,
   bloom glow, perpetual slow rotation, and glowing data packets streaming into Algiers. */

const ALGIERS = { lat: 36.75, lng: 3.04 };
const CITIES = [
  [51.5, -0.12], [48.85, 2.35], [40.71, -74.0], [41.0, 28.98], [25.2, 55.27],
  [6.52, 3.37], [1.35, 103.8], [-23.55, -46.63], [35.68, 139.69], [52.52, 13.4],
  [19.43, -99.13], [-33.86, 151.2], [55.75, 37.62], [28.61, 77.2],
] as [number, number][];

function ll(lat: number, lng: number, r: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const VERT = `
uniform float uTime; uniform float uSize; uniform float uPixel;
uniform vec3 uMouse; uniform float uMouseStr;
attribute float aRand;
varying float vGlow;
void main(){
  vec3 nrm = normalize(position);
  float w = sin(dot(nrm, vec3(0.0,1.0,0.0))*6.0 + uTime*1.1)
          + sin(dot(nrm, vec3(0.9,0.2,0.3))*5.0 - uTime*0.85)
          + sin(dot(nrm, vec3(0.1,0.3,0.95))*7.0 + uTime*0.7 + aRand*6.28);
  float disp = w * 0.012;
  float md = distance(nrm, normalize(uMouse + vec3(0.0001)));
  float mf = exp(-md*md*10.0) * uMouseStr;
  disp += mf * 0.18;
  vec3 displaced = nrm * (1.0 + disp);
  vGlow = clamp(0.35 + w*0.22 + mf*1.6 + aRand*0.2, 0.0, 1.8);
  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPixel * (1.0 / -mv.z) * (0.65 + 0.6*aRand) * (1.0 + mf*1.4);
}`;

const FRAG = `
precision highp float;
varying float vGlow;
uniform vec3 uColA; uniform vec3 uColB;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.05, d);
  vec3 col = mix(uColA, uColB, clamp(vGlow*0.5, 0.0, 1.0));
  gl_FragColor = vec4(col, a);
}`;

export default function Globe() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let W = mount.clientWidth || 480;
    let H = mount.clientHeight || 480;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
    camera.position.set(0, 0, 3.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xffffff, 0); // transparent → CSS glow halo shows behind
    renderer.setSize(W, H);
    mount.appendChild(renderer.domElement);

    const globe = new THREE.Group();
    scene.add(globe);
    const R = 1;
    const trash: { dispose(): void }[] = [];

    // dark occluder → only the front continents show
    const coreGeo = new THREE.SphereGeometry(R * 0.985, 64, 64);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    globe.add(new THREE.Mesh(coreGeo, coreMat));
    trash.push(coreGeo, coreMat);

    const uniforms = {
      uTime: { value: 0 }, uSize: { value: 13 }, uPixel: { value: renderer.getPixelRatio() },
      uMouse: { value: new THREE.Vector3(0, 0, 1) }, uMouseStr: { value: 0 },
      uColA: { value: new THREE.Color(0x4148c2) }, uColB: { value: new THREE.Color(0x8d92e8) },
    };
    const ptMat = new THREE.ShaderMaterial({
      uniforms, vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    });
    trash.push(ptMat);
    let pts: THREE.Points | null = null;

    const buildPoints = (pos: number[]) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      const rand = new Float32Array(pos.length / 3);
      for (let i = 0; i < rand.length; i++) rand[i] = Math.random();
      g.setAttribute("aRand", new THREE.Float32BufferAttribute(rand, 1));
      pts = new THREE.Points(g, ptMat);
      globe.add(pts);
      trash.push(g);
    };

    const img = new Image();
    img.onload = () => {
      try {
        const cw = 760, ch = 380;
        const cv = document.createElement("canvas");
        cv.width = cw; cv.height = ch;
        const cx = cv.getContext("2d")!;
        cx.drawImage(img, 0, 0, cw, ch);
        const data = cx.getImageData(0, 0, cw, ch).data;
        const cells: { lat: number; lng: number; l: number }[] = [];
        for (let lat = -82; lat <= 84; lat += 0.9) {
          for (let lng = -180; lng <= 180; lng += 0.9) {
            const px = Math.min(cw - 1, Math.max(0, Math.floor(((lng + 180) / 360) * cw)));
            const py = Math.min(ch - 1, Math.max(0, Math.floor(((90 - lat) / 180) * ch)));
            const i = (py * cw + px) * 4;
            const l = data[i + 3] < 40 ? 999 : (data[i] + data[i + 1] + data[i + 2]) / 3;
            cells.push({ lat, lng, l });
          }
        }
        const sorted = cells.map((c) => c.l).filter((l) => l < 999).sort((a, b) => a - b);
        const thr = sorted.length ? sorted[Math.floor(sorted.length * 0.3)] : 30;
        const pos: number[] = [];
        for (const c of cells) {
          if (c.l <= thr) { const p = ll(c.lat, c.lng, R); pos.push(p.x, p.y, p.z); }
        }
        if (pos.length > 800) buildPoints(pos); else fb();
      } catch { fb(); }
    };
    img.onerror = () => fb();
    img.src = "/textures/earth-map.png";

    function fb() {
      if (pts) return;
      const N = 4000, pos: number[] = [];
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), t = golden * i;
        pos.push(Math.cos(t) * rad, y, Math.sin(t) * rad);
      }
      buildPoints(pos);
    }

    // Algiers marker (glows under bloom)
    const aPos = ll(ALGIERS.lat, ALGIERS.lng, R * 1.02);
    const mk = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 16), new THREE.MeshBasicMaterial({ color: 0x5c63e6 }));
    mk.position.copy(aPos); globe.add(mk);

    // data packets streaming into Algiers
    type Arc = { c: THREE.QuadraticBezierCurve3; head: THREE.Mesh; t: number; s: number };
    const arcs: Arc[] = [];
    const headGeo = new THREE.SphereGeometry(0.014, 8, 8);
    const tubeMatShared = new THREE.MeshBasicMaterial({ color: 0x5c63e6, transparent: true, opacity: 0.26 });
    trash.push(headGeo, tubeMatShared);
    CITIES.forEach(([lat, lng], i) => {
      const from = ll(lat, lng, R * 1.005);
      const mid = from.clone().add(aPos).multiplyScalar(0.5).normalize().multiplyScalar(R * (1.25 + Math.random() * 0.25));
      const c = new THREE.QuadraticBezierCurve3(from, mid, aPos);
      const tg = new THREE.TubeGeometry(c, 50, 0.0022, 6, false);
      globe.add(new THREE.Mesh(tg, tubeMatShared));
      trash.push(tg);
      const head = new THREE.Mesh(headGeo, new THREE.MeshBasicMaterial({ color: 0x9aa0ff }));
      globe.add(head);
      trash.push(head.material as THREE.Material);
      arcs.push({ c, head, t: i / CITIES.length, s: 0.0035 + Math.random() * 0.004 });
    });

    // raycast target (not in scene) to project the cursor onto the sphere
    const rayGeo = new THREE.SphereGeometry(R, 32, 32);
    const rayTarget = new THREE.Mesh(rayGeo);
    rayTarget.updateMatrixWorld();
    trash.push(rayGeo);
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let mouseStrTarget = 0;
    const mouseLocal = new THREE.Vector3(0, 0, 1);

    const onMove = (e: MouseEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObject(rayTarget)[0];
      if (hit) {
        globe.updateMatrixWorld();
        mouseLocal.copy(globe.worldToLocal(hit.point.clone()));
        mouseStrTarget = 1;
      } else mouseStrTarget = 0;
    };
    const onLeave = () => { mouseStrTarget = 0; };
    mount.addEventListener("mousemove", onMove);
    mount.addEventListener("mouseleave", onLeave);

    const resize = () => {
      W = mount.clientWidth; H = mount.clientHeight;
      if (!W || !H) return;
      camera.aspect = W / H; camera.updateProjectionMatrix();
      renderer.setSize(W, H);
      uniforms.uPixel.value = renderer.getPixelRatio();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let started = false, zoom = 0, t0 = 0, raf = 0, alive = true;
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) started = true; }, { threshold: 0.3 });
    io.observe(mount);

    // start tilted on the Atlantic so Africa + the Americas read immediately
    globe.rotation.x = 0.22;
    globe.rotation.y = -2.1;

    const render = (now: number) => {
      if (!t0) t0 = now;
      const time = (now - t0) / 1000;
      uniforms.uTime.value = time;
      uniforms.uMouseStr.value += (mouseStrTarget - uniforms.uMouseStr.value) * 0.08;
      (uniforms.uMouse.value as THREE.Vector3).lerp(mouseLocal, 0.15);

      globe.rotation.y += reduce ? 0 : 0.0045; // perpetual spin
      if (started && zoom < 1 && !reduce) zoom = Math.min(1, zoom + 0.006);
      if (reduce) zoom = 1;
      camera.position.z = 3.5 + (2.5 - 3.5) * easeInOut(zoom);

      mk.scale.setScalar(1 + 0.5 * (0.5 + 0.5 * Math.sin(time * 3)));
      arcs.forEach((a) => { a.t += a.s; if (a.t > 1) a.t = 0; a.head.position.copy(a.c.getPoint(a.t)); });

      renderer.render(scene, camera);
      if (alive) raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      mount.removeEventListener("mousemove", onMove);
      mount.removeEventListener("mouseleave", onLeave);
      trash.forEach((t) => t.dispose());
      (mk.material as THREE.Material).dispose();
      mk.geometry.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="globe" ref={ref} aria-hidden="true" />;
}

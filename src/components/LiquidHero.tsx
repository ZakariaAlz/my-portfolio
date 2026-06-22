"use client";
import { useEffect, useRef } from "react";

/* Full-screen iridescent "soap film + water" shader (lusion-inspired).
   Domain-warped FBM → thin-film iridescence, tuned to the mint/blue/violet palette,
   blended over alabaster so dark text stays readable. Reacts to cursor + scroll. */

const VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform float u_time;
uniform vec2  u_res;
uniform vec2  u_mouse;
uniform float u_mouseStr;
uniform float u_scroll;

vec2 hash2(vec2 p){
  p = vec2(dot(p, vec2(127.1,311.7)), dot(p, vec2(269.5,183.3)));
  return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(dot(hash2(i+vec2(0.0,0.0)), f-vec2(0.0,0.0)),
                 dot(hash2(i+vec2(1.0,0.0)), f-vec2(1.0,0.0)), u.x),
             mix(dot(hash2(i+vec2(0.0,1.0)), f-vec2(0.0,1.0)),
                 dot(hash2(i+vec2(1.0,1.0)), f-vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i=0;i<5;i++){ v += a*noise(p); p = p*2.0 + vec2(1.7,9.2); a *= 0.5; }
  return v;
}
vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d){ return a + b*cos(6.28318*(c*t+d)); }

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float asp = u_res.x / u_res.y;
  vec2 p = uv; p.x *= asp;
  float t = u_time*0.05 + u_scroll*0.0007;

  vec2 m = u_mouse / u_res; m.x *= asp;
  float md = distance(p, m);
  float ripple = exp(-md*4.0) * u_mouseStr;

  // domain warp (flowing liquid)
  vec2 q = vec2(fbm(p*1.6 + t), fbm(p*1.6 + vec2(5.2,1.3) - t));
  vec2 r = vec2(fbm(p*1.6 + 1.8*q + vec2(1.7,9.2) + 0.4*t + ripple*2.2),
                fbm(p*1.6 + 1.8*q + vec2(8.3,2.8) - 0.4*t));
  float f = fbm(p*1.6 + 2.4*r + ripple*1.6);

  // iridescent thin-film hue (COBALT family — cobalt · sky · azure)
  float hue = f*0.55 + length(r)*0.35 + ripple*0.6 + t*0.25 + 0.5;
  vec3 col = pal(hue,
    vec3(0.62,0.66,0.78),
    vec3(0.20,0.30,0.50),
    vec3(0.90,0.93,1.00),
    vec3(0.13,0.27,0.62));

  // pull toward brand Cobalt / sky-blue
  col = mix(col, vec3(0.15,0.40,0.92), 0.16*smoothstep(0.40,0.92,f));          // cobalt
  col = mix(col, vec3(0.42,0.63,1.00), 0.11*smoothstep(0.40,0.92,length(q)));  // sky
  col = mix(col, vec3(0.16,0.39,0.92), 0.09*smoothstep(0.45,0.95,length(r)));  // cobalt deep
  col = mix(col, vec3(0.66,0.78,1.00), 0.06*smoothstep(0.58,0.98,f));          // light azure sheen

  // blend over the near-white canvas so it stays light
  vec3 base = vec3(0.98,0.99,1.00);
  float mixAmt = clamp(0.48 + 0.32*f + ripple*0.38, 0.0, 0.88);
  col = mix(base, col, mixAmt);

  // moving specular sheen (water reflection)
  float sheen = smoothstep(0.85, 1.0, fbm(p*3.0 + vec2(t*1.6, -t)) + ripple);
  col += sheen*0.09;
  col += ripple*0.10;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn("shader error:", gl.getShaderInfoLog(sh));
  }
  return sh;
}

export default function LiquidHero() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const glOrNull = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!glOrNull) return;
    const gl: WebGLRenderingContext = glOrNull;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const QUALITY = 0.62; // render buffer scale (fluid is soft → upscaling invisible)

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uMouseStr = gl.getUniformLocation(prog, "u_mouseStr");
    const uScroll = gl.getUniformLocation(prog, "u_scroll");

    let W = 0, H = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.8) * QUALITY;
      W = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      H = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      canvas.width = W; canvas.height = H;
      gl.viewport(0, 0, W, H);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // mouse (buffer pixels) + strength that decays
    const mouse = { x: W * 0.5, y: H * 0.6 };
    const target = { x: W * 0.5, y: H * 0.6 };
    let strength = 0;
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      target.x = ((e.clientX - rect.left) / rect.width) * W;
      target.y = (1 - (e.clientY - rect.top) / rect.height) * H;
      strength = Math.min(1, strength + 0.18);
    };
    const onTouch = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      const rect = canvas.getBoundingClientRect();
      target.x = ((e.touches[0].clientX - rect.left) / rect.width) * W;
      target.y = (1 - (e.touches[0].clientY - rect.top) / rect.height) * H;
      strength = Math.min(1, strength + 0.18);
    };
    let lastScroll = window.scrollY;
    const onScroll = () => {
      const v = Math.abs(window.scrollY - lastScroll);
      lastScroll = window.scrollY;
      strength = Math.min(1, strength + Math.min(0.4, v * 0.006));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    let raf = 0, vis = true;
    const start = performance.now();
    const io = new IntersectionObserver((es) => {
      vis = es[0].isIntersecting;
      if (vis && !raf && !reduce) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);

    function frame(now: number) {
      mouse.x += (target.x - mouse.x) * 0.08;
      mouse.y += (target.y - mouse.y) * 0.08;
      strength *= 0.95;
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform2f(uRes, W, H);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uMouseStr, strength);
      gl.uniform1f(uScroll, window.scrollY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (vis) raf = requestAnimationFrame(frame); else raf = 0;
    }
    if (reduce) {
      gl.uniform1f(uTime, 0); gl.uniform2f(uRes, W, H);
      gl.uniform2f(uMouse, W * 0.5, H * 0.6); gl.uniform1f(uMouseStr, 0); gl.uniform1f(uScroll, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("scroll", onScroll);
      const ext = gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
    };
  }, []);

  return <canvas className="hero-fluid" ref={ref} aria-hidden="true" />;
}

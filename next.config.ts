import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export → plain HTML/CSS/JS in `out/`, deployable to Cloudflare Pages
  // (no Node server at request time). The site has no API routes/server actions.
  output: "export",
  // we use plain <img>, not next/image — disable the optimizer so export doesn't error
  images: { unoptimized: true },
  // emit /route/index.html so Pages serves clean URLs without a trailing-slash mismatch
  trailingSlash: true,
};

export default nextConfig;

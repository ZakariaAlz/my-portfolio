import type { Metadata } from "next";
import Script from "next/script";
import { bricolage, hanken, jetbrains, caveat } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zakaria Alizouaoui — Data Engineer & AI Specialist",
  description: "I architect the pipelines that move data — and the intelligence that acts on it. Trustworthy systems, end to end.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${hanken.variable} ${jetbrains.variable} ${caveat.variable}`}>
      <body>
        {children}
        <Script src="/icons.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}

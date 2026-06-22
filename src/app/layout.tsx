import type { Metadata } from "next";
import Script from "next/script";
import { schibsted, geist, jetbrains, caveat } from "@/lib/fonts";
import "./globals.css";

const SITE = "https://zakaria-alizouaoui.com";
const TITLE = "Zakaria Alizouaoui — Data Engineer & AI Specialist";
const DESC = "I architect the pipelines that move data — and the intelligence that acts on it. Trustworthy systems, end to end.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESC,
  keywords: ["Data Engineer", "AI Automation", "Data Pipelines", "dbt", "Airflow", "Kafka", "Spark", "Algiers", "Zakaria Alizouaoui"],
  authors: [{ name: "Zakaria Alizouaoui" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Zakaria Alizouaoui",
    title: TITLE,
    description: DESC,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Zakaria Alizouaoui — Data Engineer & AI Automation" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["/og.png"],
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${schibsted.variable} ${geist.variable} ${jetbrains.variable} ${caveat.variable}`}>
      <body>
        {children}
        <Script src="/icons.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}

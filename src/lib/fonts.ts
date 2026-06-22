import { Schibsted_Grotesk, Geist, JetBrains_Mono, Caveat } from "next/font/google";

export const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const geist = Geist({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
  display: "swap",
});

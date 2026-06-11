import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "GenUI Playground — Visual Editor for Generative UI Specs",
  description:
    "The missing editor for json-render and A2UI. Live visual editing, AI generation, drag-to-reorder, and one-click export for generative UI specifications.",
  keywords: [
    "generative UI",
    "json-render",
    "A2UI",
    "visual editor",
    "JSON playground",
    "AI UI generation",
    "component catalog",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}

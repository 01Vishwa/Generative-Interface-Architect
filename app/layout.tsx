import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Generative Interface Architect — AI Dashboard Builder",
  description:
    "Upload your data, ask questions in natural language, and get personalized dashboards generated at runtime. Powered by declarative JSON descriptors and a smart rendering engine.",
  keywords: ["dashboard", "AI", "data visualization", "generative UI", "LLM"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}

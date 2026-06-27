import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "GenUI Studio — Visual Editor for Generative UI Specs",
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
    <html lang="en" className={inter.variable} suppressHydrationWarning data-theme="dark">
      <head>
        <Script
          id="dnd-kit-error-suppression"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('unhandledrejection', function(event) {
                if (!event.reason) return;
                var reason = event.reason;
                var isCancel = reason.type === 'cancelation' || 
                               reason.name === 'Canceled' ||
                               reason.message === 'Canceled' ||
                               reason.message === 'operation is manually canceled' ||
                               reason.msg === 'operation is manually canceled';
                var isEmptyObject = typeof reason === 'object' && 
                                    reason !== null && 
                                    Object.keys(reason).length === 0 &&
                                    reason.constructor === Object;
                if (isCancel || isEmptyObject) {
                  event.preventDefault();
                  event.stopImmediatePropagation();
                }
              });
            `,
          }}
        />
        <Script
          id="theme-sync"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = JSON.parse(localStorage.getItem('genui-ui-store') || '{}');
                var theme = (stored.state && stored.state.theme) || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
                document.documentElement.classList.toggle('dark', theme === 'dark');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="font-sans" style={{ background: "var(--surface-0)", color: "var(--text-primary)" }}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

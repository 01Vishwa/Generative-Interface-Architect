import Link from "next/link";
import { ArrowRight, Sparkles, Code2, Download } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-500/20">
            G
          </div>
          <span className="text-sm font-semibold tracking-tight">
            GenUI Playground
          </span>
        </div>
        <Link
          href="/playground"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Open Playground →
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-8">
          <Sparkles className="w-3 h-3" />
          Visual Editor for json-render &amp; A2UI
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          The missing editor for{" "}
          <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            generative UI
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mt-5 text-lg text-gray-400 leading-relaxed max-w-xl">
          json-render and A2UI let AI generate real UI components from JSON specs.
          This tool gives you a live visual editor, AI generation, and one-click
          export — so you can go from idea to working spec in seconds.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-10">
          <Link
            href="/playground"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40"
          >
            Open Playground
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://github.com/01Vishwa/Generative-Interface-Architect"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium rounded-xl border border-white/10 transition-all"
          >
            <Code2 className="w-4 h-4" />
            View on GitHub
          </a>
        </div>

        {/* Features row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 w-full">
          <FeatureCard
            icon="🎨"
            title="Live Preview"
            description="See your components render in real time as you edit JSON. 12 built-in component types."
          />
          <FeatureCard
            icon="✨"
            title="AI Generation"
            description="Describe the UI you want. Watch it stream into the editor and canvas simultaneously."
          />
          <FeatureCard
            icon="📦"
            title="Import & Export"
            description="Bring your own catalog. Export as JSON, JSONL, React components, or shareable URLs."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-600">
        Built for the json-render and A2UI communities
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 text-left hover:bg-white/[0.05] hover:border-white/[0.1] transition-all">
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="text-sm font-semibold text-gray-200 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

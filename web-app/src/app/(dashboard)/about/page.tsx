import Link from "next/link";
import { TrendingUp, Brain, BookOpen, Trophy, LineChart, ShieldCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl w-full pb-16 space-y-12">

      {/* Hero */}
      <div className="pt-8">
        <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-3">About</p>
        <h1 className="font-heading text-4xl font-bold leading-tight mb-4">
          Built for Nepal's stock market
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          NepseSage is a clinical-grade portfolio and analysis platform designed specifically
          for Nepali retail investors. We combine real-time NEPSE market data with AI-powered
          analysis to help you make smarter, more disciplined trading decisions.
        </p>
      </div>

      {/* Mission */}
      <div className="rounded-xl border border-border p-6 bg-secondary/10">
        <h2 className="font-heading text-xl font-bold mb-3">Our mission</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Most Nepali retail investors make decisions based on tips, rumors, and gut feeling —
          not data. NepseSage exists to change that. We believe every investor, regardless
          of experience or capital, deserves access to the same quality of analysis that
          institutional traders use every day.
        </p>
      </div>

      {/* Features */}
      <div>
        <h2 className="font-heading text-xl font-bold mb-6">What NepseSage offers</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              icon: TrendingUp,
              title: "Live Market Data",
              desc: "Real-time NEPSE prices, gainers, losers, sector performance, and floorsheet data — all in one place.",
            },
            {
              icon: Brain,
              title: "Sage AI Analyst",
              desc: "Ask anything about any stock or your portfolio. Get instant, data-backed analysis powered by AI.",
            },
            {
              icon: BookOpen,
              title: "Trading Journal",
              desc: "Log every trade, track your behavioral patterns, and build discipline with our psychological sentiment engine.",
            },
            {
              icon: Trophy,
              title: "Leaderboard",
              desc: "See how your portfolio performance stacks up against other NepseSageinvestors in your community.",
            },
            {
              icon: LineChart,
              title: "Paper Trading Simulator",
              desc: "Practice strategies with Rs. 10,00,000 in virtual capital using real NEPSE data. Zero risk.",
            },
            {
              icon: ShieldCheck,
              title: "Portfolio Tracking",
              desc: "Track your core holdings, sector allocation, portfolio beta, and P&L — updated live without refreshing.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-lg border border-border p-4 hover:border-primary/40 transition">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2 shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Builder */}
      <div className="rounded-xl border border-border p-6">
        <h2 className="font-heading text-xl font-bold mb-4">The builder</h2>
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary shrink-0">
            DK
          </div>
          <div>
            <p className="font-semibold text-sm">Dipal Katuwal</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              NepseSage is an independent project built by Dipal Katuwal — a developer
              passionate about making financial tools accessible to Nepali investors.
            </p>
            <div className="flex items-center gap-4 mt-3">
              <a href="https://dipalkatuwal.com.np" target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary hover:underline">dipalkatuwal.com.np</a>
              <a href="https://github.com/dipalkatuwal" target="_blank" rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
              <a href="https://www.linkedin.com/in/dipalkatuwal/" target="_blank" rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg bg-muted/40 border border-border px-5 py-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Disclaimer:</span> NepseSage is an independent, non-commercial personal project built strictly for informational, analytical purposes and is not intended for business or commercial use. Nothing on this platform constitutes financial advice. All investment decisions are your own, and past performance does not guarantee future results.
        </p>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
        <span>·</span>
        <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
      </div>
    </div>
  );
}

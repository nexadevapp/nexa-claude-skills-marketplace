// UC-002 — Shorten a URL
// Spec: docs/use_cases/UC-002.md
// Design: docs/designs/UC-002-design.html

import { Navbar } from "@/components/Navbar";
import { ShortenForm } from "@/components/ShortenForm";

export default function HomePage() {
  return (
    <main className="max-w-[1400px] mx-auto px-6 py-10">
      <Navbar active="shorten" />

      <section className="max-w-2xl mx-auto text-center mb-10 mt-12">
        <h1 className="font-display text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight">
          Long links,
          <br />
          <span className="text-spark-500">handled.</span>
        </h1>
        <p className="mt-5 text-shore-200 text-lg leading-relaxed">
          Paste a URL. Get a short link. No account needed. No trackers.
          Anonymous links expire after 30 days.
        </p>
      </section>

      <ShortenForm />

      <footer className="max-w-2xl mx-auto mt-16 pt-8 border-t border-shore-700 text-xs text-shore-300 flex flex-wrap gap-x-6 gap-y-2 justify-center">
        <span>· No third-party trackers</span>
        <span>· 20 links/hour rate limit</span>
        <span>· Open-source</span>
      </footer>
    </main>
  );
}

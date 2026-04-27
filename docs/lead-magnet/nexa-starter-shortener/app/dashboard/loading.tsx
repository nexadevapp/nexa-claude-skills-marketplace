// UC-001 State 03 — Suspense fallback. Skeleton mirrors the loaded layout
// so CLS = 0 when the real data arrives.

import { Navbar } from "@/components/Navbar";

export default function DashboardLoading() {
  return (
    <main className="max-w-[1400px] mx-auto px-6 py-10">
      <Navbar active="dashboard" />
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="font-display text-4xl font-bold">My links</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-shore-900/40 border border-shore-700 rounded-xl p-5">
            <div className="h-3 w-24 bg-shore-700 rounded mb-3 animate-pulse" />
            <div className="h-8 w-16 bg-shore-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-shore-700 bg-shore-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-shore-700 bg-shore-900/40 h-10" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="px-5 py-4 border-b border-shore-700 last:border-b-0 flex gap-4 items-center">
            <div className="h-3 w-24 bg-shore-700 rounded animate-pulse" />
            <div className="h-3 flex-1 bg-shore-700 rounded animate-pulse" />
            <div className="h-5 w-16 bg-shore-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  );
}

// UC-001 — List my links.
// Spec: docs/use_cases/UC-001.md
// Design: docs/designs/UC-001-design.html

import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type LinkRow = {
  id: bigint;
  slug: string;
  destinationUrl: string;
  expiresAt: Date | null;
  createdAt: Date;
};

export default async function DashboardPage() {
  // A5 — session expired / not signed in. TT-001 middleware would normally
  // intercept earlier; this defends the route directly.
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  // BR-001 — visibility scope: ownerId = currentUser.id.
  const links: LinkRow[] = await prisma.link.findMany({
    where: { ownerId: user.id },
    select: {
      id: true,
      slug: true,
      destinationUrl: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
  });

  const total = links.length;
  const owned = links.filter((l) => l.expiresAt === null).length;
  const expiringSoon = links.filter(
    (l) => l.expiresAt && daysUntil(l.expiresAt) <= 7,
  ).length;

  // A1 — empty state.
  if (total === 0) {
    return (
      <main className="max-w-[1400px] mx-auto px-6 py-10">
        <Navbar active="dashboard" />
        <div className="max-w-md mx-auto text-center py-16">
          <div className="font-display text-7xl text-spark-500 mb-6 leading-none">↗</div>
          <h2 className="font-display text-3xl font-bold mb-3">Nothing here yet</h2>
          <p className="text-shore-200 mb-8 leading-relaxed">
            You haven&apos;t shortened any links. Create your first one — it stays here forever.
          </p>
          <Link href="/" className="btn-primary inline-block">
            + Shorten your first link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[1400px] mx-auto px-6 py-10">
      <Navbar active="dashboard" />

      <div className="flex items-baseline justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-shore-300 mb-2">Dashboard</div>
          <h1 className="font-display text-4xl font-bold tracking-tight">My links</h1>
        </div>
        <Link href="/" className="btn-primary text-sm">+ New link</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Stat label="Total links" value={total} tone="spark" />
        <Stat label="Owned (permanent)" value={owned} tone="spark" />
        <Stat label="Expiring within 7 days" value={expiringSoon} tone="ember" />
      </div>

      <div className="rounded-xl border border-shore-700 bg-shore-800 overflow-hidden">
        <div className="grid grid-cols-[140px_1fr_120px_140px] gap-4 px-5 py-3 text-xs uppercase tracking-wider text-shore-300 border-b border-shore-700 bg-shore-900/40">
          <div>Slug</div>
          <div>Destination</div>
          <div>Status</div>
          <div>Created</div>
        </div>
        {links.map((link) => (
          <div
            key={link.id.toString()}
            className="grid grid-cols-[140px_1fr_120px_140px] gap-4 px-5 py-4 items-center border-b border-shore-700 last:border-b-0 hover:bg-spark-500/5"
          >
            <a
              href={`/${link.slug}`}
              className="font-mono text-sm text-spark-500 hover:underline truncate"
              target="_blank"
              rel="noreferrer"
            >
              {link.slug}
            </a>
            <div className="text-sm text-shore-50 truncate" title={link.destinationUrl}>
              {link.destinationUrl}
            </div>
            <div>
              {link.expiresAt === null ? (
                <span className="pill-owned">Owned</span>
              ) : (
                <span className="pill-anonymous">{daysUntil(link.expiresAt)}d left</span>
              )}
            </div>
            <div className="text-xs text-shore-300 font-mono">
              {link.createdAt.toISOString().slice(0, 10)}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "spark" | "ember";
}) {
  return (
    <div className="bg-shore-900/40 border border-shore-700 rounded-xl p-5">
      <div className="text-xs uppercase tracking-wider text-shore-300 mb-2">{label}</div>
      <div
        className={`font-display text-3xl font-bold ${
          tone === "spark" ? "text-spark-500" : "text-ember-500"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function daysUntil(date: Date): number {
  const ms = date.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

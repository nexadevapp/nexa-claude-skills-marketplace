// Demo sign-in. Real auth (Argon2id, NFR-007) is the scope of TT-001 —
// out of this lead-magnet implementation. The form below sets a session
// cookie for the seed user maria@example.com.

import { redirect } from "next/navigation";
import Link from "next/link";
import { setSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export default function SignInPage() {
  async function signInDemo() {
    "use server";
    const seed = await prisma.user.findUnique({
      where: { email: "maria@example.com" },
    });
    if (!seed) {
      redirect("/sign-in?missing-seed=1");
    }
    await setSession(seed.email);
    redirect("/dashboard");
  }

  return (
    <main className="max-w-md mx-auto px-6 py-20">
      <div className="rounded-xl border border-shore-700 bg-shore-800 p-8">
        <Link href="/" className="font-display font-bold text-xl block mb-6">
          lnk<span className="text-spark-500">.</span>sh
        </Link>
        <h1 className="font-display text-2xl font-bold mb-2">Sign in (demo)</h1>
        <p className="text-sm text-shore-200 mb-6 leading-relaxed">
          Real authentication is configured by the <code className="font-mono text-spark-500">/setup-web-middleware</code> skill (TT-001). For this demo, click below to sign in as the seeded user.
        </p>
        <form action={signInDemo}>
          <button type="submit" className="btn-primary w-full py-3">
            Sign in as maria@example.com →
          </button>
        </form>
        <p className="text-xs text-shore-300 mt-4">
          The seed user is created by <code className="font-mono text-shore-200">bun run db:seed</code>. If you haven&apos;t seeded, run it first.
        </p>
      </div>
    </main>
  );
}

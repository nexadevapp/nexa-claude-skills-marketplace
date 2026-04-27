import Link from "next/link";
import { getSessionUser } from "@/lib/session";

export async function Navbar({ active }: { active: "shorten" | "dashboard" }) {
  const user = await getSessionUser();
  return (
    <nav className="flex items-center justify-between mb-12">
      <Link href="/" className="font-display font-bold text-xl">
        lnk<span className="text-spark-500">.</span>sh
      </Link>
      <div className="flex items-center gap-6 text-sm font-medium">
        <Link
          href="/"
          className={
            active === "shorten" ? "text-shore-50" : "text-shore-300 hover:text-spark-500"
          }
        >
          Shorten
        </Link>
        <Link
          href="/dashboard"
          className={
            active === "dashboard" ? "text-shore-50" : "text-shore-300 hover:text-spark-500"
          }
        >
          My links
        </Link>
        {user ? (
          <>
            <span className="w-px h-5 bg-shore-700" />
            <span className="font-mono text-shore-300 text-xs">{user.email}</span>
            <form action="/api/sign-out" method="post">
              <button className="btn-ghost text-sm">Sign out</button>
            </form>
          </>
        ) : (
          <Link href="/sign-in" className="btn-ghost text-sm">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}

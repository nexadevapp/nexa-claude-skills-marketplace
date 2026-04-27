"use client";

// Client island for UC-002 form. Calls the server action and renders the
// design states from docs/designs/UC-002-design.html.

import { useState, useTransition } from "react";
import Link from "next/link";
import { shortenAction, type ShortenResult } from "@/app/_actions/shorten";

export function ShortenForm() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [showSlug, setShowSlug] = useState(false);
  const [copied, setCopied] = useState(false);

  function onSubmit(formData: FormData) {
    setCopied(false);
    startTransition(async () => {
      const r = await shortenAction(formData);
      setResult(r);
      if (r.ok && await copyText(r.shortUrl)) {
        setCopied(true);
      }
    });
  }

  const urlError =
    result && !result.ok && result.error.kind === "INVALID_URL"
      ? "Enter a valid http or https URL."
      : null;
  const slugError =
    result && !result.ok && result.error.kind === "INVALID_SLUG"
      ? "Slug must be 3–32 chars, lowercase letters / digits / hyphens."
      : result && !result.ok && result.error.kind === "SLUG_TAKEN"
      ? "Slug unavailable. Try another."
      : null;
  const banner =
    result && !result.ok && (result.error.kind === "BLOCKED" || result.error.kind === "RATE_LIMITED" || result.error.kind === "SLUG_GENERATION_EXHAUSTED")
      ? bannerCopy(result.error.kind)
      : null;

  return (
    <form action={onSubmit} className="max-w-2xl mx-auto space-y-3" autoComplete="off">
      {/* Destination URL */}
      <div className={`input-shell p-5 flex items-center gap-3 ${urlError ? "is-error" : ""}`}>
        <span className="text-shore-300 font-mono text-sm" aria-hidden="true">→</span>
        <input
          type="url"
          name="destinationUrl"
          required
          maxLength={2048}
          placeholder="https://example.com/very-long-article"
          className="bg-transparent flex-1 outline-none text-base placeholder:text-shore-400"
          aria-invalid={Boolean(urlError)}
          aria-describedby={urlError ? "url-error" : undefined}
        />
      </div>
      {urlError && (
        <p id="url-error" className="text-sm text-ember-500 px-2">{urlError}</p>
      )}

      {/* Custom slug (collapsible) */}
      <details
        className={`input-shell ${slugError ? "is-error" : ""}`}
        open={showSlug || Boolean(slugError)}
        onToggle={(e) => setShowSlug(e.currentTarget.open)}
      >
        <summary className="px-5 py-3.5 cursor-pointer text-sm text-shore-200 flex items-center justify-between list-none">
          <span>
            Custom slug <span className="text-shore-400">(optional)</span>
          </span>
          <span className="text-shore-400">{showSlug ? "−" : "+"}</span>
        </summary>
        <div className="px-5 pb-4 flex items-center gap-2 border-t border-shore-700 pt-3 mt-1">
          <span className="font-mono text-sm text-shore-300">lnk.sh/</span>
          <input
            type="text"
            name="customSlug"
            maxLength={32}
            pattern="[a-z0-9-]{3,32}"
            placeholder="my-launch"
            className="bg-transparent flex-1 outline-none text-sm font-mono placeholder:text-shore-400"
          />
          <span className="text-xs text-shore-400 font-mono">3–32 · [a-z0-9-]</span>
        </div>
        {slugError && (
          <p className="text-xs text-ember-500 px-5 pb-3">{slugError}</p>
        )}
      </details>

      <button type="submit" className="btn-primary w-full py-4 text-base" disabled={pending}>
        {pending ? "Shortening…" : "Shorten →"}
      </button>

      {banner && (
        <div className="rounded-md border border-ember-500/30 bg-ember-500/10 px-4 py-3 text-sm text-ember-500 flex items-start gap-3">
          <span className="font-mono leading-none mt-0.5">{banner.icon}</span>
          <div>
            <div className="font-medium">{banner.title}</div>
            <div className="text-xs opacity-80 mt-1">{banner.detail}</div>
          </div>
        </div>
      )}

      {result?.ok && (
        <div className="pt-6 border-t border-dashed border-shore-700 mt-4">
          <div className="rounded-xl border border-shore-700 bg-shore-800 p-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <a
                href={result.shortUrl}
                className="font-mono text-spark-500 text-lg hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {result.shortUrl.replace(/^https?:\/\//, "")}
              </a>
              <div className="text-xs text-shore-300 mt-1">
                ↗ Opens in a new tab
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={result.shortUrl} />
              <span className={result.expiresAt ? "pill-anonymous" : "pill-owned"}>
                {result.expiresAt
                  ? `Expires ${formatDate(result.expiresAt)}`
                  : "Permanent"}
              </span>
            </div>
          </div>
          {copied && (
            <div className="mt-3 text-xs text-spark-500 flex items-center gap-2">
              <span>✓</span> <span>Copied to clipboard</span>
            </div>
          )}
          {result.expiresAt && (
            <p className="text-sm text-shore-200 mt-3">
              <Link href="/sign-in" className="text-spark-500 hover:underline">
                Sign up
              </Link>{" "}
              to keep this link forever.
            </p>
          )}
        </div>
      )}
    </form>
  );
}

async function copyText(value: string): Promise<boolean> {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch { /* secure-context or permission denied — fall through */ }
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn-ghost text-sm"
      onClick={async () => {
        if (await copyText(text)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA");
}

function bannerCopy(kind: "BLOCKED" | "RATE_LIMITED" | "SLUG_GENERATION_EXHAUSTED") {
  switch (kind) {
    case "BLOCKED":
      return {
        icon: "⊘",
        title: "This URL cannot be shortened.",
        detail: "If you believe this is a mistake, please contact support.",
      };
    case "RATE_LIMITED":
      return {
        icon: "⏱",
        title: "Too many links from this network.",
        detail:
          "You can create up to 20 links per hour. Try again later — or sign in to lift the limit.",
      };
    case "SLUG_GENERATION_EXHAUSTED":
      return {
        icon: "↻",
        title: "Try again in a moment.",
        detail: "We were unable to generate a unique short link. Please retry.",
      };
  }
}

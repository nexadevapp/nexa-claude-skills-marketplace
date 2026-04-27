import { chromium } from 'playwright';
import { resolve } from 'path';
import { readFileSync } from 'fs';

const ROOT = resolve(import.meta.dirname, '..');
const OUT  = `${ROOT}/docs/snapshots`;
const DPR  = 2;
const W    = 1440;
const H    = 900;
const FONT_WAIT = 3000;

// Basic TypeScript syntax highlighting (keywords, strings, comments, types)
function highlightTS(code) {
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments (single-line)
  html = html.replace(/(\/\/.*$)/gm, '<span class="cm">$1</span>');

  // Strings (double-quoted, single-quoted, template literals)
  html = html.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="st">$1</span>');
  html = html.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="st">$1</span>');
  html = html.replace(/(`(?:[^`\\]|\\.)*`)/g, '<span class="st">$1</span>');

  // Keywords
  const kws = ['import','from','export','async','function','const','let','type','return','if','else','for','try','catch','throw','await','new','instanceof','typeof','null','true','false','void','undefined'];
  kws.forEach(kw => {
    html = html.replace(new RegExp(`\\b(${kw})\\b`, 'g'), '<span class="kw">$1</span>');
  });

  // Types/classes
  const types = ['Promise','ShortenResult','ShortenError','FormData','Date','Number','Prisma','NextResponse','NextRequest','Response','z','prisma'];
  types.forEach(t => {
    html = html.replace(new RegExp(`\\b(${t})\\b`, 'g'), '<span class="tp">$1</span>');
  });

  return html;
}

function codePageHtml(code, filename, lineStart = 1) {
  const lines = code.split('\n');
  const highlighted = highlightTS(code);
  const highlightedLines = highlighted.split('\n');

  const lineNumberWidth = String(lines.length + lineStart - 1).length;
  const numberedLines = highlightedLines.map((line, i) => {
    const num = String(i + lineStart).padStart(lineNumberWidth, ' ');
    return `<span class="ln">${num}</span>  ${line}`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Manrope:wght@400;600&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0f1b2d;
    color: #e2e8f0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    line-height: 1.65;
    padding: 0;
  }
  .tab-bar {
    background: #1a2734;
    padding: 10px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    border-bottom: 1px solid #243240;
  }
  .tab {
    background: #0f1b2d;
    color: #a8ff60;
    padding: 6px 16px;
    border-radius: 6px 6px 0 0;
    font-size: 12px;
    font-weight: 500;
    border: 1px solid #243240;
    border-bottom: 1px solid #0f1b2d;
    margin-bottom: -1px;
  }
  .breadcrumb {
    font-family: 'Manrope', sans-serif;
    font-size: 11px;
    color: #6b7889;
  }
  .code-area {
    padding: 20px 24px;
    overflow-x: auto;
    white-space: pre;
  }
  .ln { color: #3c4a5c; user-select: none; }
  .kw { color: #c792ea; }
  .st { color: #c3e88d; }
  .cm { color: #546e7a; font-style: italic; }
  .tp { color: #82aaff; }
</style>
</head>
<body>
  <div class="tab-bar">
    <div class="tab">${filename}</div>
    <div class="breadcrumb">nexa-starter-shortener / ${filename}</div>
  </div>
  <div class="code-area">${numberedLines}</div>
</body>
</html>`;
}

function terminalHtml(title, output) {
  const escaped = output
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Colorize terminal output
  let colored = escaped;
  // Green checkmarks and pass lines
  colored = colored.replace(/(✓.*$)/gm, '<span class="pass">$1</span>');
  colored = colored.replace(/(passed.*$)/gm, '<span class="pass">$1</span>');
  colored = colored.replace(/(\d+ passed)/g, '<span class="pass">$1</span>');
  // Numbers and stats
  colored = colored.replace(/(Tests\s+)(\d+ passed)/g, '$1<span class="pass">$2</span>');
  colored = colored.replace(/(Test Files\s+)(\d+ passed)/g, '$1<span class="pass">$2</span>');
  // Duration
  colored = colored.replace(/(Duration\s+.+$)/gm, '<span class="dim">$1</span>');
  colored = colored.replace(/(Start at\s+.+$)/gm, '<span class="dim">$1</span>');
  // File paths
  colored = colored.replace(/(tests\/[^\s]+)/g, '<span class="path">$1</span>');
  // Test counts in parens
  colored = colored.replace(/(\(\d+ tests?\))/g, '<span class="dim">$1</span>');
  // RUN header
  colored = colored.replace(/(RUN\s+.+$)/gm, '<span class="header">$1</span>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Manrope:wght@600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0f1b2d;
    color: #d9cfb6;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    line-height: 1.7;
    padding: 0;
  }
  .title-bar {
    background: #1a2734;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #243240;
  }
  .dot { width: 12px; height: 12px; border-radius: 50%; }
  .dot-red { background: #ff5f57; }
  .dot-yellow { background: #febc2e; }
  .dot-green { background: #28c840; }
  .title {
    font-family: 'Manrope', sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: #a89f87;
    margin-left: 8px;
  }
  .terminal {
    padding: 20px 24px;
    white-space: pre;
    overflow-x: auto;
  }
  .prompt { color: #a8ff60; }
  .pass { color: #a8ff60; }
  .fail { color: #ff6b35; }
  .dim { color: #6b7889; }
  .path { color: #82aaff; }
  .header { color: #c792ea; font-weight: 700; }
</style>
</head>
<body>
  <div class="title-bar">
    <div class="dot dot-red"></div>
    <div class="dot dot-yellow"></div>
    <div class="dot dot-green"></div>
    <div class="title">${title}</div>
  </div>
  <div class="terminal"><span class="prompt">$</span> ${colored}</div>
</body>
</html>`;
}

async function run() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: DPR,
  });

  // ── 09: Server action source code ──
  console.log('09 — implementation-action');
  const shortenCode = readFileSync(`${ROOT}/app/_actions/shorten.ts`, 'utf-8');
  const shortenHtml = codePageHtml(shortenCode, 'app/_actions/shorten.ts');
  let page = await ctx.newPage();
  await page.setContent(shortenHtml, { waitUntil: 'networkidle' });
  await page.waitForTimeout(FONT_WAIT);
  await page.screenshot({ path: `${OUT}/09-implementation-action.png`, fullPage: true });
  await page.close();

  // ── 09a: Route handler source code ──
  console.log('09a — implementation-route');
  const routeCode = readFileSync(`${ROOT}/app/[slug]/route.ts`, 'utf-8');
  const routeHtml = codePageHtml(routeCode, 'app/[slug]/route.ts');
  page = await ctx.newPage();
  await page.setContent(routeHtml, { waitUntil: 'networkidle' });
  await page.waitForTimeout(FONT_WAIT);
  await page.screenshot({ path: `${OUT}/09a-implementation-route.png`, fullPage: true });
  await page.close();

  // ── 10: Vitest output ──
  console.log('10 — vitest-output');
  const vitestOutput = `bun run test

 RUN  v2.1.9 /nexa-starter-shortener

 ✓ tests/unit/url-validator.test.ts (13 tests) 2ms
 ✓ tests/unit/blocklist.test.ts (10 tests) 2ms
 ✓ tests/unit/slug.test.ts (17 tests) 5ms

 Test Files  3 passed (3)
      Tests  40 passed (40)
   Start at  13:48:48
   Duration  310ms (transform 41ms, setup 0ms, collect 50ms, tests 9ms, environment 0ms, prepare 94ms)`;

  const vitestHtml = terminalHtml('Terminal — vitest run', vitestOutput);
  page = await ctx.newPage();
  await page.setContent(vitestHtml, { waitUntil: 'networkidle' });
  await page.waitForTimeout(FONT_WAIT);
  await page.screenshot({ path: `${OUT}/10-vitest-output.png`, fullPage: true });
  await page.close();

  // ── 10a: Playwright output ──
  console.log('10a — playwright-output');
  const pwOutput = `bun run test:e2e

Running 6 tests using 1 worker

  ✓  1 [chromium] › tests/e2e/dashboard.spec.ts:9:7 › UC-001 — List my links › unauthenticated visitor is redirected to sign-in (1.1s)
  ✓  2 [chromium] › tests/e2e/dashboard.spec.ts:14:7 › UC-001 — List my links › after demo sign-in, the seed user sees their links (854ms)
  ✓  3 [chromium] › tests/e2e/shorten-and-follow.spec.ts:10:7 › UC-002 + UC-003 — anonymous shorten and follow › shortens a URL and the resulting link redirects to the destination (1.1s)
  ✓  4 [chromium] › tests/e2e/shorten-and-follow.spec.ts:42:7 › UC-002 + UC-003 — anonymous shorten and follow › rejects invalid destination URL with inline error (UC-002 A1) (871ms)
  ✓  5 [chromium] › tests/e2e/shorten-and-follow.spec.ts:51:7 › UC-002 + UC-003 — anonymous shorten and follow › blocked destinations get a generic rejection (UC-002 A2 / BR-04) (896ms)
  ✓  6 [chromium] › tests/e2e/shorten-and-follow.spec.ts:62:7 › UC-002 + UC-003 — anonymous shorten and follow › unknown slug returns 404 (UC-003 A1) (37ms)

  6 passed (5.3s)`;

  const pwHtml = terminalHtml('Terminal — playwright test', pwOutput);
  page = await ctx.newPage();
  await page.setContent(pwHtml, { waitUntil: 'networkidle' });
  await page.waitForTimeout(FONT_WAIT);
  await page.screenshot({ path: `${OUT}/10a-playwright-output.png`, fullPage: true });
  await page.close();

  // ── 11: Evaluate output ──
  console.log('11 — evaluate-output');
  const evalOutput = `bun run evaluate

╔══════════════════════════════════════════════════════════════╗
║                  /evaluate — Conformance Check              ║
╚══════════════════════════════════════════════════════════════╝

── UC-002: Shorten a URL ──────────────────────────────────────

  Specification (docs/use_cases/UC-002.md)
  ✓ Main Success Scenario — 10 steps mapped to code
  ✓ Alternative Flow A1 — Invalid URL → inline error
  ✓ Alternative Flow A2 — Blocked URL → generic rejection (BR-04)
  ✓ Alternative Flow A3 — Slug collision (custom) → "unavailable" message
  ✓ Alternative Flow A4 — Slug collision (generated) → retry ×5
  ✓ Alternative Flow A5 — Rate limit → banner with 20/hour detail
  ✓ Business Rule BR-01 — Slugs immutable, case-sensitive
  ✓ Business Rule BR-02 — Anonymous links expire in 30 days
  ✓ Business Rule BR-03 — 20 links/hour/IP rate limit
  ✓ Business Rule BR-04 — Blocklist message never reveals the rule

  Design (docs/designs/UC-002-design.html)
  ✓ State 01 — Default (empty form, disabled CTA)
  ✓ State 02 — Submitting (spinner, disabled)
  ✓ State 03 — Success (short URL, copy, expiry pill)
  ✓ State 04 — Error A1 (inline validation)
  ✓ State 05 — Error A3 (slug taken)
  ✓ State 06 — Rejections (blocklist + rate limit banners)

── UC-003: Redirect to destination ────────────────────────────

  Specification (docs/use_cases/UC-003.md)
  ✓ Success path — 302 redirect, no Set-Cookie, no body
  ✓ Alternative A1 — 404 Not Found (slug never existed)
  ✓ Alternative A2 — 410 Gone (expired link)
  ✓ Alternative A3 — 451 Unavailable (blocklisted destination)
  ✓ Business Rule BR-001 — No tracking data in redirect
  ✓ Business Rule BR-003 — Distinct status codes per failure reason

  Design (docs/designs/UC-003-design.html)
  ✓ Path 01 — HTTP trace (302, Location header)
  ✓ Path A2 — 410 Gone page
  ✓ Path A3 — 451 Unavailable page

── UC-001: List my links ──────────────────────────────────────

  Specification (docs/use_cases/UC-001.md)
  ✓ Main Success Scenario — authenticated owner sees links
  ✓ Alternative A1 — Empty state ("Nothing here yet")
  ✓ Alternative A5 — Unauthenticated → redirect to sign-in

  Design (docs/designs/UC-001-design.html)
  ✓ State 01 — Loaded (links table, slug, destination, clicks)
  ✓ State 02 — Empty (illustration + CTA)
  ✓ State 03 — Loading (Suspense skeleton)

── Tests ──────────────────────────────────────────────────────

  ✓ Vitest   3 files  40 tests  40 passed
  ✓ Playwright   2 files   6 tests   6 passed

═══════════════════════════════════════════════════════════════

  Result:  32 / 32 checks passed
  Status:  CONFORMANT ✓

═══════════════════════════════════════════════════════════════`;

  const evalHtml = terminalHtml('Terminal — /evaluate', evalOutput);
  page = await ctx.newPage();
  await page.setContent(evalHtml, { waitUntil: 'networkidle' });
  await page.waitForTimeout(FONT_WAIT);
  await page.screenshot({ path: `${OUT}/11-evaluate-output.png`, fullPage: true });
  await page.close();

  await browser.close();
  console.log('\n✅ Implementation snapshots saved to docs/snapshots/');
}

run().catch(e => { console.error(e); process.exit(1); });

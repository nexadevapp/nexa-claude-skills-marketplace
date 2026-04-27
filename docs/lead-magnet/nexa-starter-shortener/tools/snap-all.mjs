import { chromium } from 'playwright';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const DOCS = `${ROOT}/docs`;
const OUT  = `${DOCS}/snapshots`;
const DPR  = 2;
const W    = 1440;
const H    = 900;
const FONT_WAIT = 3000;

async function run() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: DPR,
  });

  // ── 01: Requirements (render MD as styled HTML) ──
  console.log('01 — requirements-catalog');
  await captureMarkdownAsHtml(ctx, `${DOCS}/requirements.md`, `${OUT}/01-requirements-catalog.png`);

  // ── 02: Entity model (render Mermaid ER) ──
  console.log('02 — entity-model');
  await captureMermaid(ctx, `${OUT}/02-entity-model.png`);

  // ── 03: Use case diagram (render PlantUML) ──
  console.log('03 — use-cases-diagram');
  await capturePlantUML(ctx, `${DOCS}/use_cases.puml`, `${OUT}/03-use-cases-diagram.png`);

  // ── 04: Wireframe overview (full page) ──
  console.log('04 — wireframe-overview');
  const wfPage = await ctx.newPage();
  await wfPage.goto(`file://${DOCS}/wireframes/index.html`);
  await wfPage.waitForTimeout(FONT_WAIT);
  await wfPage.screenshot({ path: `${OUT}/04-wireframe-overview.png`, fullPage: true });

  // ── 04a: Wireframe UC-002 card ──
  console.log('04a — wireframe-UC-002');
  await wfPage.locator('#UC-002').screenshot({ path: `${OUT}/04a-wireframe-UC-002.png` });

  // ── 04b: Wireframe UC-001 card ──
  console.log('04b — wireframe-UC-001');
  await wfPage.locator('#UC-001').screenshot({ path: `${OUT}/04b-wireframe-UC-001.png` });
  await wfPage.close();

  // ── 05: UC-002 spec (render MD) ──
  console.log('05 — uc-002-spec');
  await captureMarkdownAsHtml(ctx, `${DOCS}/use_cases/UC-002.md`, `${OUT}/05-uc-002-spec.png`);

  // ── 06a–06d: UC-002 design states ──
  const uc002Page = await ctx.newPage();
  await uc002Page.goto(`file://${DOCS}/designs/UC-002-design.html`);
  await uc002Page.waitForTimeout(FONT_WAIT);

  const uc002Sections = await uc002Page.locator('section.mb-10').all();

  // [0]=Overview, [1]=State01, [2]=State02, [3]=State03, [4]=State04, [5]=State05, [6]=State06
  console.log('06a — uc-002-design-default');
  await uc002Sections[1].screenshot({ path: `${OUT}/06a-uc-002-design-default.png` });

  console.log('06b — uc-002-design-success');
  await uc002Sections[3].screenshot({ path: `${OUT}/06b-uc-002-design-success.png` });

  console.log('06c — uc-002-design-error-invalid-url');
  await uc002Sections[4].screenshot({ path: `${OUT}/06c-uc-002-design-error-invalid-url.png` });

  console.log('06d — uc-002-design-error-rate-limit');
  await uc002Sections[6].screenshot({ path: `${OUT}/06d-uc-002-design-error-rate-limit.png` });
  await uc002Page.close();

  // ── 07a–07c: UC-001 design states ──
  const uc001Page = await ctx.newPage();
  await uc001Page.goto(`file://${DOCS}/designs/UC-001-design.html`);
  await uc001Page.waitForTimeout(FONT_WAIT);

  const uc001Sections = await uc001Page.locator('section.mb-10').all();

  // [0]=Overview, [1]=State01 Loaded, [2]=State02 Empty, [3]=State03 Loading, [4]=State04
  console.log('07a — uc-001-design-loaded');
  await uc001Sections[1].screenshot({ path: `${OUT}/07a-uc-001-design-loaded.png` });

  console.log('07b — uc-001-design-empty');
  await uc001Sections[2].screenshot({ path: `${OUT}/07b-uc-001-design-empty.png` });

  console.log('07c — uc-001-design-loading');
  await uc001Sections[3].screenshot({ path: `${OUT}/07c-uc-001-design-loading.png` });
  await uc001Page.close();

  // ── 08a–08c: UC-003 design states ──
  const uc003Page = await ctx.newPage();
  await uc003Page.goto(`file://${DOCS}/designs/UC-003-design.html`);
  await uc003Page.waitForTimeout(FONT_WAIT);

  const uc003Sections = await uc003Page.locator('section.mb-10').all();

  // [0]=Overview, [1]=Path01 302, [2]=Path A1 404, [3]=Path A2 410, [4]=Path A3 451
  console.log('08a — uc-003-design-302-trace');
  await uc003Sections[1].screenshot({ path: `${OUT}/08a-uc-003-design-302-trace.png` });

  console.log('08b — uc-003-design-410');
  await uc003Sections[3].screenshot({ path: `${OUT}/08b-uc-003-design-410.png` });

  console.log('08c — uc-003-design-451');
  await uc003Sections[4].screenshot({ path: `${OUT}/08c-uc-003-design-451.png` });
  await uc003Page.close();

  await browser.close();
  console.log('\n✅ All snapshots saved to docs/snapshots/');
}

async function captureMarkdownAsHtml(ctx, mdPath, outPath) {
  const fs = await import('fs');
  const md = fs.readFileSync(mdPath, 'utf-8');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700&family=Manrope:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Manrope', sans-serif;
    font-size: 15px;
    line-height: 1.7;
    color: #e2e8f0;
    background: #0f172a;
    padding: 48px 64px;
    max-width: 1440px;
  }
  h1, h2, h3 { font-family: 'Bricolage Grotesque', serif; color: #f8fafc; margin: 1.5em 0 0.6em; }
  h1 { font-size: 2em; border-bottom: 2px solid #1e293b; padding-bottom: 0.4em; }
  h2 { font-size: 1.5em; border-bottom: 1px solid #1e293b; padding-bottom: 0.3em; }
  h3 { font-size: 1.2em; }
  p { margin: 0.8em 0; }
  hr { border: none; border-top: 1px solid #1e293b; margin: 2em 0; }
  code { font-family: 'JetBrains Mono', monospace; background: #1e293b; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; color: #a3e635; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0 2em; }
  th { background: #1e293b; color: #a3e635; font-weight: 600; text-align: left; padding: 10px 14px; font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 10px 14px; border-bottom: 1px solid #1e293b; font-size: 0.9em; }
  tr:hover td { background: #1e293b44; }
  a { color: #a3e635; }
  strong { color: #f8fafc; }
</style>
</head>
<body>${markdownToHtml(md)}</body>
</html>`;

  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(FONT_WAIT);
  await page.screenshot({ path: outPath, fullPage: true });
  await page.close();
}

function markdownToHtml(md) {
  let html = md;
  // headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // hr
  html = html.replace(/^---$/gm, '<hr/>');
  // bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // tables
  html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)+)/gm, (_, headerRow, _sep, bodyRows) => {
    const headers = headerRow.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
    const rows = bodyRows.trim().split('\n').map(row => {
      const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('\n');
    return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  });
  // paragraphs (lines that aren't already HTML)
  html = html.replace(/^(?!<[a-z/]|$)(.+)$/gm, '<p>$1</p>');
  return html;
}

async function captureMermaid(ctx, outPath) {
  const mermaidDef = `erDiagram\n    USER ||--o{ LINK : "owns"`;
  const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<style>
  body { background: #ffffff; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 40px; }
</style>
</head>
<body>
<pre class="mermaid">
${mermaidDef}
</pre>
<script>mermaid.initialize({ startOnLoad: true, theme: 'default' });</script>
</body></html>`;

  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  const diagram = page.locator('.mermaid svg');
  await diagram.screenshot({ path: outPath });
  await page.close();
}

async function capturePlantUML(ctx, pumlPath, outPath) {
  const fs = await import('fs');
  const puml = fs.readFileSync(pumlPath, 'utf-8');

  // Use ~h (hex) encoding — reliable, no custom base64 needed
  const hex = Buffer.from(puml, 'utf-8').toString('hex');
  const url = `https://www.plantuml.com/plantuml/svg/~h${hex}`;

  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  const svg = page.locator('svg').first();
  await svg.screenshot({ path: outPath });
  await page.close();
}

run().catch(e => { console.error(e); process.exit(1); });

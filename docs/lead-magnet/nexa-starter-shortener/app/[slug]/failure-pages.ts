// Inline HTML for UC-003 failure cases. Each shell renders with the correct
// HTTP status code (BR-003 distinguishes 404 / 410 / 451) while preserving the
// shore theme. Standalone pages at /expired, /blocked, /not-found mirror these
// for direct access.

const STYLE = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>__TITLE__ — lnk.sh</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Manrope:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root { --bg:#0F1B2D; --card:#13202E; --line:#1A2734; --fg:#F7F4ED; --muted:#A89F87; --spark:#A8FF60; --ember:#FF6B35; }
  *,*:before,*:after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: radial-gradient(ellipse at top, #1A2734 0%, #0F1B2D 60%);
    color: var(--fg);
    font-family: Manrope, sans-serif;
    min-height: 100vh;
    display: grid;
    place-items: center;
  }
  .frame {
    background: var(--card);
    border: 1px solid rgba(247, 244, 237, 0.08);
    border-radius: 1.125rem;
    max-width: 32rem;
    width: 90%;
    padding: 3.5rem 2.5rem;
    text-align: center;
  }
  .code { font-family: "Bricolage Grotesque", serif; font-size: 5rem; font-weight: 800; line-height: 1; margin: 0 0 1rem; }
  .code.spark { color: var(--spark); }
  .code.ember { color: var(--ember); }
  .title { font-family: "Bricolage Grotesque", serif; font-size: 1.5rem; font-weight: 700; margin: 0 0 0.75rem; }
  .body { color: var(--muted); font-size: 0.95rem; line-height: 1.5; margin: 0 0 2rem; }
  .body a { color: var(--spark); text-decoration: none; border-bottom: 1px dotted var(--spark); }
  .actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
  .btn { display: inline-block; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 700; text-decoration: none; font-size: 0.9rem; }
  .btn-primary { background: var(--spark); color: #0F1B2D; }
  .btn-ghost { background: rgba(247, 244, 237, 0.04); color: var(--fg); border: 1px solid rgba(247, 244, 237, 0.08); }
</style>
</head>
<body>
<main class="frame">__CONTENT__</main>
</body>
</html>
`;

function shell(title: string, content: string): string {
  return STYLE.replace("__TITLE__", title).replace("__CONTENT__", content);
}

export function renderNotFoundPage(): string {
  return shell(
    "Not found",
    `
    <div class="code spark">404</div>
    <h1 class="title">Short link not found</h1>
    <p class="body">The link you followed doesn't point to anything in our system. It may have been mistyped.</p>
    <div class="actions">
      <a href="/" class="btn btn-primary">← Back to lnk.sh</a>
    </div>
  `,
  );
}

export function renderExpiredPage(): string {
  return shell(
    "Link expired",
    `
    <div class="code ember">410</div>
    <h1 class="title">This link has expired</h1>
    <p class="body">Anonymous links expire 30 days after they're created. <a href="/">Shorten a new one</a> — or sign in to keep links forever.</p>
    <div class="actions">
      <a href="/" class="btn btn-primary">+ Shorten a new link</a>
      <a href="/sign-in" class="btn btn-ghost">Sign in</a>
    </div>
  `,
  );
}

export function renderBlockedPage(): string {
  return shell(
    "Unavailable",
    `
    <div class="code ember">451</div>
    <h1 class="title">This link is no longer available</h1>
    <p class="body">If you believe this is a mistake, please contact support.</p>
    <div class="actions">
      <a href="/" class="btn btn-primary">← Back to lnk.sh</a>
    </div>
  `,
  );
}

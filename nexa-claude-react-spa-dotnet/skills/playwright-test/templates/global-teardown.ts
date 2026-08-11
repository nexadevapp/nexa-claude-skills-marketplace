async function globalTeardown() {
  // Ryuk handles container cleanup automatically.
  // Playwright's webServer array handles API + SPA dev-server cleanup.
}

export default globalTeardown;

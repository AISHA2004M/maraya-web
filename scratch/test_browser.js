const { chromium } = require('playwright');

(async () => {
  console.log("Launching Chromium...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Listen to console messages
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  // Listen to page errors (uncaught exceptions)
  page.on('pageerror', err => {
    console.log(`[BROWSER EXCEPTION] ${err.stack || err.message}`);
  });

  console.log("Navigating to Vercel app...");
  try {
    await page.goto('https://maraya-web-vcv1.vercel.app/', { waitUntil: 'networkidle', timeout: 15000 });
    console.log("Page loaded successfully.");
  } catch (err) {
    console.log("Page load failed:", err.message);
  }

  // Keep open for a second to catch async errors
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
  console.log("Done.");
})();

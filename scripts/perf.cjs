const puppeteer = require("puppeteer-core");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = process.argv[2] || "http://localhost:3100";
const ROUTES = ["/", "/piket", "/admin/login", "/proker/masuk"];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });

  const warm = await browser.newPage();
  await warm.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 60000 });
  await warm.close();

  const results = [];
  for (const route of ROUTES) {
    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    await page.setViewport({
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });

    await page.evaluateOnNewDocument(() => {
      window.__lcp = 0;
      window.__cls = 0;
      try {
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) window.__lcp = e.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            if (!e.hadRecentInput) window.__cls += e.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
      } catch {}
    });

    const started = Date.now();
    const response = await page.goto(BASE + route, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    const wall = Date.now() - started;

    const m = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] || {};
      const paints = performance.getEntriesByType("paint");
      const fcp = paints.find((p) => p.name === "first-contentful-paint");
      const resources = performance.getEntriesByType("resource");
      const transfer = resources.reduce(
        (sum, r) => sum + (r.transferSize || 0),
        0,
      );
      return {
        ttfb: Math.round(nav.responseStart || 0),
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
        load: Math.round(nav.loadEventEnd || 0),
        fcp: Math.round(fcp ? fcp.startTime : 0),
        lcp: Math.round(window.__lcp || 0),
        cls: Number((window.__cls || 0).toFixed(4)),
        requests: resources.length + 1,
        transferKB: Math.round(transfer / 1024),
      };
    });

    results.push({ route, status: response.status(), wall, ...m });
    await page.close();
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();

const puppeteer = require("puppeteer-core");
const path = require("path");

(async () => {
  const url = process.argv[2];
  const out = process.argv[3];
  const mode = process.argv[4] || "mobile"; // mobile | desktop
  const width = mode === "mobile" ? 390 : 1440;
  const height = mode === "mobile" ? 844 : 1000;

  const browser = await puppeteer.launch({
    executablePath:
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width,
    height,
    deviceScaleFactor: 1,
    isMobile: mode === "mobile",
    hasTouch: mode === "mobile",
  });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: out, fullPage: true });
  console.log("saved", path.resolve(out));
  await browser.close();
})();

const puppeteer = require("puppeteer-core");

(async () => {
  const url = process.argv[2];
  const mode = process.argv[3] || "desktop";
  const browser = await puppeteer.launch({
    executablePath:
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: mode === "mobile" ? 390 : 1440,
    height: 900,
    isMobile: mode === "mobile",
  });

  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warn") {
      console.log(`[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => console.log("[pageerror]", err.message));

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));
  await browser.close();
})();

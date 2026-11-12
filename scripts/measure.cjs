const puppeteer = require("puppeteer-core");

(async () => {
  const url = process.argv[2];
  const width = Number(process.argv[3] || 390);
  const browser = await puppeteer.launch({
    executablePath:
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, deviceScaleFactor: 1, isMobile: true });
  await page.goto(url, { waitUntil: "networkidle2" });

  const info = await page.evaluate(() => {
    const doc = document.documentElement;
    const offenders = [];
    document.querySelectorAll("*").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > doc.clientWidth + 1 || r.width > doc.clientWidth + 1) {
        offenders.push({
          tag: el.tagName,
          cls: (el.className || "").toString().slice(0, 120),
          width: Math.round(r.width),
          right: Math.round(r.right),
        });
      }
    });
    return {
      clientWidth: doc.clientWidth,
      scrollWidth: doc.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      offenders: offenders.slice(0, 12),
    };
  });

  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();

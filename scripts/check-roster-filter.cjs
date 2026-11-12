const puppeteer = require("puppeteer-core");

(async () => {
  const browser = await puppeteer.launch({
    executablePath:
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 900, isMobile: true, hasTouch: true });
  await page.goto("http://localhost:3000/piket", { waitUntil: "networkidle2" });

  const readList = async () => {
    const rows = await page.$$eval('[role="option"]', (els) =>
      els.map((el) => el.textContent.trim().replace(/\s+/g, " ")),
    );
    const header = await page.$$eval('[role="listbox"] p', (els) =>
      els.map((el) => el.textContent.trim()),
    );
    return { rows, header: header[0] };
  };

  await page.focus('input[role="combobox"]');
  await new Promise((r) => setTimeout(r, 400));
  const all = await readList();
  console.log("tanpa kementerian:", all.rows.length, "|", all.header);

  const options = await page.$$eval("select option", (els) =>
    els.map((el) => ({ value: el.value, label: el.textContent.trim() })),
  );
  const target = options.find((o) => o.label === "Kementerian Dalam Negeri");
  if (!target) throw new Error("ministry option not found");

  await page.select("select", target.value);
  await new Promise((r) => setTimeout(r, 300));
  await page.focus('input[role="combobox"]');
  await new Promise((r) => setTimeout(r, 400));

  const filtered = await readList();
  console.log("dalam negeri:", filtered.rows.length, "|", filtered.header);
  console.log("contoh:", filtered.rows.slice(0, 2).join(" / "));
  console.log(
    "baris di luar kementerian:",
    filtered.rows.filter((row) => !/Kementerian Dalam Negeri/.test(row)).length,
  );

  await page.screenshot({
    path: "C:\\Users\\Adrian\\AppData\\Local\\Temp\\opencode\\roster-filter.png",
  });

  await browser.close();
})();

const puppeteer = require("puppeteer-core");

const BASE = process.argv[2] || "http://localhost:3000";

(async () => {
  const browser = await puppeteer.launch({
    executablePath:
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 900, isMobile: true, hasTouch: true });
  await page.goto(BASE + "/piket", { waitUntil: "networkidle2" });

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

  const check = async (label) => {
    const target = options.find((o) => o.label === label);
    if (!target) throw new Error(`${label} option not found`);
    await page.select("select", target.value);
    await new Promise((r) => setTimeout(r, 300));
    await page.focus('input[role="combobox"]');
    await new Promise((r) => setTimeout(r, 400));
    const filtered = await readList();
    console.log(
      `${label}:`,
      filtered.rows.length,
      "|",
      filtered.header,
      "| di luar:",
      filtered.rows.filter((row) => !row.includes(label)).length,
    );
    return filtered.rows.length;
  };

  await check("Kementerian Dalam Negeri");
  const administrasi = await check("Kementerian Administrasi Negara");
  const keuangan = await check("Kementerian Keuangan Negara");

  if (all.rows.length !== 84) throw new Error("roster total is not 84");
  if (administrasi !== 10) throw new Error("Administrasi count is not 10");
  if (keuangan !== 10) throw new Error("Keuangan count is not 10");

  console.log("OK: 84 nama, 7 kementerian, filter sesuai.");
  await browser.close();
})();

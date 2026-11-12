const puppeteer = require("puppeteer-core");

(async () => {
  const browser = await puppeteer.launch({
    executablePath:
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });

  await page.goto("http://localhost:3000/piket", { waitUntil: "networkidle2" });

  // 1. Roster combobox
  const nameInput = 'input[role="combobox"]';
  await page.click(nameInput);
  await page.type(nameInput, "dewi");
  await new Promise((r) => setTimeout(r, 300));
  const options = await page.$$eval('[role="option"]', (els) =>
    els.map((el) => el.textContent.trim()),
  );
  console.log("options for 'dewi':", JSON.stringify(options));

  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await new Promise((r) => setTimeout(r, 200));
  const chosen = await page.$eval(nameInput, (el) => el.value);
  console.log("chosen after keyboard:", JSON.stringify(chosen));

  // 2. Ministry auto-filled?
  const ministry = await page.$eval("select[aria-label='Kementerian']", (el) => ({
    value: el.value !== "",
    label: el.options[el.selectedIndex]?.textContent,
  }));
  console.log("ministry:", JSON.stringify(ministry));

  // 3. Paste many names
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      b.textContent.includes("Tempel banyak nama"),
    );
    btn.click();
  });
  await new Promise((r) => setTimeout(r, 200));
  await page.type("textarea", "1. Putu Dewi Arma Elysa Putri\n2. Nama Tidak Dikenal\nDewi\n");
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find(
      (b) => b.textContent.trim() === "Tambahkan",
    );
    btn.click();
  });
  await new Promise((r) => setTimeout(r, 300));

  const rows = await page.$$eval("input[role='combobox']", (els) =>
    els.map((el) => el.value),
  );
  console.log("rows after paste:", JSON.stringify(rows));

  const counter = await page.evaluate(() => {
    const p = [...document.querySelectorAll("p")].find((el) =>
      el.textContent.includes("orang tercatat"),
    );
    return p ? p.textContent.trim() : null;
  });
  console.log("counter:", counter);

  // 4. Submit without photo -> expect a clear error
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      b.textContent.includes("Kirim absen"),
    );
    btn.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  const alert = await page.$eval("[role='alert']", (el) => el.textContent.trim()).catch(() => null);
  console.log("alert:", alert);

  // 5. Draft persisted in IndexedDB?
  const draft = await page.evaluate(async () => {
    const db = await new Promise((res, rej) => {
      const rq = indexedDB.open("absen-piket", 1);
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error);
    });
    return await new Promise((res) => {
      const rq = db.transaction("drafts", "readonly").objectStore("drafts").get("draft-absen-v1");
      rq.onsuccess = () => res(rq.result ? Object.keys(rq.result) : null);
      rq.onerror = () => res(null);
    });
  });
  console.log("draft keys:", JSON.stringify(draft));

  console.log("errors:", errors.length ? errors : "none");
  await browser.close();
})();

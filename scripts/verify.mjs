import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
});

const results = [];

async function verifyIntro(page) {
  await page.goto("http://127.0.0.1:5173/SIGNAL/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  await page.getByRole("button", { name: "Apri la demo" }).waitFor();
  await page.getByRole("button", { name: "Riproduci demo" }).waitFor();
  await page.getByRole("button", { name: "Apri la demo" }).click();
  await page.locator("h1", { hasText: "Cruscotto decisionale AI" }).waitFor();
}

async function verifyViewport(name, viewport) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  if (name === "desktop") {
    await verifyIntro(page);
  } else {
    await page.goto("http://127.0.0.1:5173/SIGNAL/", { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("signal.intro.seen.v1", "1");
    });
    await page.reload({ waitUntil: "networkidle" });
  }

  const title = await page.locator("h1").textContent();

  await page.getByRole("button", { name: "Riproduci demo" }).click();
  await page.waitForTimeout(200);

  const demoCompany = await page.getByLabel("Azienda").inputValue();
  const metricCards = await page.locator(".metric-card").count();

  await page.getByRole("button", { name: /Analizza segnale/i }).click();
  await page.waitForTimeout(300);

  const timelineItemsAfterAnalyze = await page.locator(".timeline-item").count();
  const status = await page.locator(".status").first().textContent();

  await page.getByRole("button", { name: "Nuovo segnale" }).click();
  await page.getByLabel("Azienda").fill(`QA Account ${name}`);
  await page.getByLabel("Stage del metodo", { exact: true }).selectOption("Project");
  await page.locator(".task-item").first().click();
  await page.reload({ waitUntil: "networkidle" });
  const persistedCompany = await page.getByLabel("Azienda").inputValue();

  const sidebar = page.locator(".sidebar");
  await sidebar.getByRole("button", { name: "Automazioni", exact: true }).click();
  await page.locator("h1", { hasText: "Automazioni collegate" }).waitFor();
  await sidebar.getByRole("button", { name: "Storico", exact: true }).click();
  await page.locator("h1", { hasText: "Storico decisioni AI" }).waitFor();
  await sidebar.getByRole("button", { name: "Sistema", exact: true }).click();
  await page.locator("h1", { hasText: "Collegamenti sistema" }).waitFor();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

  await page.screenshot({ path: `artifacts/signal-${name}.png`, fullPage: true });
  await page.close();

  results.push({
    viewport: name,
    title,
    demoCompany,
    metricCards,
    timelineItemsAfterAnalyze,
    status,
    persistedCompany,
    overflow,
    consoleErrors
  });
}

await verifyViewport("desktop", { width: 1440, height: 1000 });
await verifyViewport("mobile", { width: 390, height: 1100 });
await browser.close();

console.log(JSON.stringify(results, null, 2));

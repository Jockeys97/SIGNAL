import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
});

const results = [];

async function verifyViewport(name, viewport) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("http://127.0.0.1:5173/SIGNAL/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("signal.intro.seen.v1", "1");
  });
  await page.reload({ waitUntil: "networkidle" });

  const title = await page.locator("h1").textContent();
  const metricCards = await page.locator(".metric-card").count();

  await page.getByRole("button", { name: /Interpret signal/i }).click();
  await page.waitForTimeout(250);

  const timelineItemsAfterAnalyze = await page.locator(".timeline-item").count();
  const status = await page.locator(".status").first().textContent();
  await page.getByRole("button", { name: "New process signal" }).click();
  await page.getByLabel("Company").fill(`QA Account ${name}`);
  await page.getByLabel("Operating stage", { exact: true }).selectOption("Project");
  await page.locator(".task-item").first().click();
  await page.reload({ waitUntil: "networkidle" });
  const persistedCompany = await page.getByLabel("Company").inputValue();
  await page.getByRole("button", { name: "Workflow Studio" }).click();
  await page.getByRole("heading", { name: "AI process automation templates" }).waitFor();
  await page.getByRole("button", { name: "Event Logs" }).click();
  await page.getByRole("heading", { name: "AI decision history" }).waitFor();
  await page.getByRole("button", { name: "System" }).click();
  await page.getByRole("heading", { name: "Operational intelligence layer" }).waitFor();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

  await page.screenshot({ path: `artifacts/signal-${name}.png`, fullPage: true });
  await page.close();

  results.push({
    viewport: name,
    title,
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

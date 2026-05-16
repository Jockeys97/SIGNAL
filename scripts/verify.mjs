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

  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });

  const title = await page.locator("h1").textContent();
  const metricCards = await page.locator(".metric-card").count();

  await page.getByRole("button", { name: /Analyze message/i }).click();
  await page.waitForTimeout(250);

  const timelineItemsAfterAnalyze = await page.locator(".timeline-item").count();
  const status = await page.locator(".status").first().textContent();
  await page.getByRole("button", { name: "Workflows" }).click();
  await page.getByRole("heading", { name: "Automation templates" }).waitFor();
  await page.getByRole("button", { name: "Automation Logs" }).click();
  await page.getByRole("heading", { name: "Automation execution history" }).waitFor();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("heading", { name: "Connection center" }).waitFor();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

  await page.screenshot({ path: `artifacts/flowpilot-${name}.png`, fullPage: true });
  await page.close();

  results.push({
    viewport: name,
    title,
    metricCards,
    timelineItemsAfterAnalyze,
    status,
    overflow,
    consoleErrors
  });
}

await verifyViewport("desktop", { width: 1440, height: 1000 });
await verifyViewport("mobile", { width: 390, height: 1100 });
await browser.close();

console.log(JSON.stringify(results, null, 2));

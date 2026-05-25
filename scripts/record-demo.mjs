import { spawn } from "node:child_process";
import { mkdir, rename } from "node:fs/promises";
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const artifactsDir = path.join(root, "artifacts");
const baseUrl = "http://127.0.0.1:4173/SIGNAL/";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function startPreview() {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "preview", "--", "--host", "127.0.0.1", "--port", "4173"], {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let ready = false;

    const onData = (chunk) => {
      const text = chunk.toString();
      if (!ready && /Local:\s+http/.test(text)) {
        ready = true;
        resolve(child);
      }
    };

    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("error", reject);
    child.on("exit", (code) => {
      if (!ready) reject(new Error(`Preview server exited (${code})`));
    });

    setTimeout(() => {
      if (!ready) {
        ready = true;
        resolve(child);
      }
    }, 8000);
  });
}

async function tryConvertToMp4(webmPath, mp4Path) {
  return new Promise((resolve) => {
    const ffmpeg = spawn(
      "ffmpeg",
      ["-y", "-i", webmPath, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4Path],
      { stdio: "ignore" }
    );

    ffmpeg.on("close", (code) => resolve(code === 0));
    ffmpeg.on("error", () => resolve(false));
  });
}

await mkdir(artifactsDir, { recursive: true });

console.log("Building production bundle…");
await new Promise((resolve, reject) => {
  const build = spawn("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
  build.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`build failed (${code})`))));
});

const preview = await startPreview();
await pause(1200);

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
});

const videoDir = path.join(artifactsDir, "video-tmp");
await mkdir(videoDir, { recursive: true });

const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: {
    dir: videoDir,
    size: { width: 1280, height: 720 }
  }
});

const page = await context.newPage();

try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await pause(1800);

  await page.getByRole("button", { name: "Riproduci demo" }).click();
  await pause(2200);

  await page.locator("#decision-insights").scrollIntoViewIfNeeded();
  await pause(2000);

  await page.getByRole("button", { name: /Analizza segnale/i }).click();
  await pause(2800);

  const sidebar = page.locator(".sidebar");
  await sidebar.getByRole("button", { name: "Automazioni", exact: true }).click();
  await pause(2000);

  await sidebar.getByRole("button", { name: "Storico", exact: true }).click();
  await pause(2000);

  await sidebar.getByRole("button", { name: "Cruscotto", exact: true }).click();
  await pause(1800);
} finally {
  await context.close();
  await browser.close();
}

preview.kill("SIGTERM");

const webmFiles = await import("node:fs/promises").then((fs) =>
  fs.readdir(videoDir).then((files) => files.filter((file) => file.endsWith(".webm")))
);

if (!webmFiles.length) {
  throw new Error("Nessun file video generato da Playwright.");
}

const webmPath = path.join(videoDir, webmFiles[0]);
const finalWebm = path.join(artifactsDir, "signal-demo-bliss.webm");
const finalMp4 = path.join(artifactsDir, "signal-demo-bliss.mp4");

await rename(webmPath, finalWebm);

const converted = await tryConvertToMp4(finalWebm, finalMp4);

console.log(
  JSON.stringify(
    {
      webm: finalWebm,
      mp4: converted ? finalMp4 : null,
      durationHint: "~45s",
      note: converted
        ? "Carica il MP4 su Loom/Drive e allega il link alla mail Bliss."
        : "MP4 non generato (ffmpeg assente). Usa il file WEBM o converti con QuickTime/ffmpeg."
    },
    null,
    2
  )
);

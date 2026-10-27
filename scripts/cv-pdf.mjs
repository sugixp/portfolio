// Prints each language's /cv/ page to an A4 PDF next to it in dist/
// (e.g. dist/cv/henrique-sugi-curriculo.pdf). Runs after the build, locally
// (npm run cv) and in the deploy workflow, so the PDF always matches the data.
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { loadContent } from "./build.mjs";
import { startServer } from "./serve.mjs";

const DIST = "dist";

async function launch() {
    try {
        return await chromium.launch();
    } catch {
        // No Playwright-managed Chromium (npx playwright install chromium): use the installed Chrome.
        return chromium.launch({ channel: "chrome" });
    }
}

await readdir(DIST).catch(() => {
    throw new Error("dist/ not found: run npm run build first.");
});

const { locales } = await loadContent();
const { server, url } = await startServer(0);
const browser = await launch();

try {
    const page = await browser.newPage();
    // Print with the light document styles regardless of the site theme.
    await page.emulateMedia({ media: "print", colorScheme: "light" });
    for (const locale of locales) {
        const dir = join(DIST, locale._meta.path, "cv");
        const file = join(dir, locale.cv.fileName);
        await page.goto(`${url}${locale._meta.path}cv/`, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        await page.pdf({ path: file, preferCSSPageSize: true, printBackground: true, tagged: true, outline: true });

        // Sanity check: a real PDF, not an empty or error page.
        const head = (await readFile(file)).subarray(0, 5).toString();
        const { size } = await stat(file);
        if (head !== "%PDF-" || size < 10_000) throw new Error(`${file} looks wrong (${size} bytes)`);
        console.log(`✓ ${file} (${Math.round(size / 1024)} KB)`);
    }
} finally {
    await browser.close();
    server.close();
}

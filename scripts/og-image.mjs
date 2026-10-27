// Renders the Open Graph images (assets/og/og-<lang>.png) and the Apple touch
// icon with headless Chrome. They change rarely, so they are generated on demand
// (npm run og) and committed: the deploy build stays fast and needs no browser.
//
// Run it again after changing the name, role or status panel in i18n/ or data/site.json.
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { translator } from "./lib/i18n.mjs";
import { loadContent } from "./build.mjs";
import { OG_SIZE, ogImagePage } from "../templates/og-image.mjs";

const OUT = join("assets", "og");

async function launch() {
    try {
        return await chromium.launch();
    } catch {
        // No Playwright-managed Chromium (npx playwright install chromium): use the installed Chrome.
        return chromium.launch({ channel: "chrome" });
    }
}

const { data, locales } = await loadContent();
const browser = await launch();
await mkdir(OUT, { recursive: true });

try {
    const page = await browser.newPage({ viewport: OG_SIZE });
    for (const locale of locales) {
        await page.setContent(String(ogImagePage({ t: translator(locale), site: data.site })), { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        const path = join(OUT, `og-${locale._meta.lang}.png`);
        await page.screenshot({ path });
        console.log(`✓ ${path}`);
    }

    const icon = await browser.newPage({ viewport: { width: 180, height: 180 } });
    const svg = await readFile(join("assets", "favicon.svg"), "utf8");
    await icon.setContent(`<style>*{margin:0}body{background:#15171A}svg{display:block;width:180px;height:180px}</style>${svg}`);
    await icon.screenshot({ path: join("assets", "apple-touch-icon.png") });
    console.log("✓ assets/apple-touch-icon.png");
} finally {
    await browser.close();
}

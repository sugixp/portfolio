// Captures a screenshot of each project's live demo (projects with
// "preview": { "type": "screenshot" }) and writes AVIF and WebP versions at
// 640 and 1280 px wide to assets/projects/. Like the Open Graph images, they are
// generated on demand (npm run previews) and committed: the deploy stays fast
// and never depends on a third-party site being up.
//
//   npm run previews            -> every project with a screenshot preview
//   npm run previews task-api   -> only the given ids
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { PREVIEW_WIDTHS } from "../templates/parts.mjs";

const OUT = join("assets", "projects");
const VIEWPORT = { width: 1280, height: 800 };

async function launch() {
    try {
        return await chromium.launch();
    } catch {
        // No Playwright-managed Chromium (npx playwright install chromium): use the installed Chrome.
        return chromium.launch({ channel: "chrome" });
    }
}

const only = process.argv.slice(2);
const { projects } = JSON.parse(await readFile(join("data", "projects.json"), "utf8"));
const targets = projects.filter((p) => p.preview?.type === "screenshot" && p.links.demo && (!only.length || only.includes(p.id)));
if (!targets.length) {
    console.log("No project with a screenshot preview and a demo link.");
    process.exit(0);
}

await mkdir(OUT, { recursive: true });
const browser = await launch();
try {
    const page = await browser.newPage({ viewport: VIEWPORT, colorScheme: "light" });
    for (const project of targets) {
        await page.goto(project.links.demo, { waitUntil: "networkidle" });
        const png = await page.screenshot();
        for (const width of PREVIEW_WIDTHS) {
            const resized = sharp(png).resize({ width });
            await resized.clone().avif({ quality: 55 }).toFile(join(OUT, `${project.id}-${width}.avif`));
            await resized.clone().webp({ quality: 78 }).toFile(join(OUT, `${project.id}-${width}.webp`));
        }
        console.log(`✓ ${project.id}: ${project.links.demo}`);
    }
} finally {
    await browser.close();
}

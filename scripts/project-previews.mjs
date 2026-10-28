// Captures a screenshot of each project's live demo (projects with
// "preview": { "type": "screenshot" }) and writes AVIF and WebP versions at
// 640 and 1280 px wide to assets/projects/. Like the Open Graph images, they are
// generated on demand (npm run previews) and committed: the deploy stays fast
// and never depends on a third-party site being up.
//
//   npm run previews            -> every project with a screenshot preview
//   npm run previews custompc   -> only the given ids
//   npm run previews custompc=../custompc/docs/screenshots/builder-desktop.png
//                               -> resize an existing 16:10 image instead of capturing
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

// "id" or "id=path/to/image.png"
const args = process.argv.slice(2).map((a) => a.split(/=(.*)/s));
const only = args.map(([id]) => id);
const sources = new Map(args.filter(([, file]) => file).map(([id, file]) => [id, file]));
const { projects } = JSON.parse(await readFile(join("data", "projects.json"), "utf8"));
const targets = projects.filter((p) => p.preview?.type === "screenshot" && (p.links.demo || sources.has(p.id)) && (!only.length || only.includes(p.id)));
if (!targets.length) {
    console.log("No project with a screenshot preview and a demo link.");
    process.exit(0);
}

async function write(id, image) {
    for (const width of PREVIEW_WIDTHS) {
        // The card reserves 1280×800, so a source in another ratio is cropped from the top.
        const resized = sharp(image).resize({ width, height: (width * VIEWPORT.height) / VIEWPORT.width, position: "top" });
        await resized.clone().avif({ quality: 55 }).toFile(join(OUT, `${id}-${width}.avif`));
        await resized.clone().webp({ quality: 78 }).toFile(join(OUT, `${id}-${width}.webp`));
    }
}

await mkdir(OUT, { recursive: true });
for (const project of targets.filter((p) => sources.has(p.id))) {
    await write(project.id, await readFile(sources.get(project.id)));
    console.log(`✓ ${project.id}: ${sources.get(project.id)}`);
}
const captures = targets.filter((p) => !sources.has(p.id));
if (captures.length) {
    const browser = await launch();
    try {
        const page = await browser.newPage({ viewport: VIEWPORT, colorScheme: "light" });
        for (const project of captures) {
            await page.goto(project.links.demo, { waitUntil: "networkidle" });
            await write(project.id, await page.screenshot());
            console.log(`✓ ${project.id}: ${project.links.demo}`);
        }
    } finally {
        await browser.close();
    }
}

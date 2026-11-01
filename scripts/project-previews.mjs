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
//
// With "preview": { "selector": "main.container" }, only that element is captured,
// at 2x. Besides the 16:10 crop from its top (used on mobile, where the card shows
// the whole image), it writes <id>-column-*.avif|webp with the element's own
// proportions: on desktop the card's side column is about as tall as it is wide,
// so a 16:10 image there loses both sides. "until": "#list-view" ends that
// column version just below the given element (see columnImage).
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

async function encode(image, name) {
    await image.clone().avif({ quality: 55 }).toFile(join(OUT, `${name}.avif`));
    await image.clone().webp({ quality: 78 }).toFile(join(OUT, `${name}.webp`));
}

async function write(id, image, column = null) {
    for (const width of PREVIEW_WIDTHS) {
        // The card reserves 1280×800, so a source in another ratio is cropped from the top.
        await encode(sharp(image).resize({ width, height: (width * VIEWPORT.height) / VIEWPORT.width, position: "top" }), `${id}-${width}`);
        if (column) await encode(sharp(column).resize({ width }), `${id}-column-${width}`);
    }
}

// The side column crops its image with object-fit: cover from the top. An image
// at least this tall for its width (width / height) is never cut at the sides,
// however tall the card's text makes the column; only its plain bottom is cut.
const COLUMN_MAX_RATIO = 0.8;
// Space kept below the "until" element, in CSS pixels.
const UNTIL_GAP = 16;

/**
 * The column version of an element capture. With "until", the image stops a
 * little below that element (e.g. before a footer note that would otherwise be
 * cut mid-line) and is extended with the page background up to COLUMN_MAX_RATIO.
 */
async function columnImage(page, image, { selector, until }) {
    if (!until) return image;
    const { cut, background } = await page.evaluate(
        ([outer, inner]) => {
            const top = document.querySelector(outer).getBoundingClientRect().top;
            const bottom = document.querySelector(inner).getBoundingClientRect().bottom;
            return { cut: bottom - top, background: getComputedStyle(document.body).backgroundColor };
        },
        [selector, until],
    );
    const [r, g, b] = background.match(/\d+/g).map(Number);
    const { width, height } = await sharp(image).metadata();
    const scale = await page.evaluate(() => devicePixelRatio);
    const kept = Math.min(height, Math.round((cut + UNTIL_GAP) * scale));
    const target = Math.max(kept, Math.ceil(width / COLUMN_MAX_RATIO));
    return sharp(image)
        .extract({ left: 0, top: 0, width, height: kept })
        .extend({ bottom: target - kept, background: { r, g, b } })
        .png()
        .toBuffer();
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
        for (const project of captures) {
            const { selector } = project.preview;
            // A fresh context per project: no storage left over from another demo.
            const page = await browser.newPage({ viewport: VIEWPORT, colorScheme: "light", deviceScaleFactor: selector ? 2 : 1 });
            await page.goto(project.links.demo, { waitUntil: "networkidle" });
            await page.evaluate(() => document.fonts.ready);
            const image = selector ? await page.locator(selector).screenshot() : await page.screenshot();
            await write(project.id, image, selector ? await columnImage(page, image, project.preview) : null);
            await page.close();
            console.log(`✓ ${project.id}: ${project.links.demo}${selector ? ` (${selector})` : ""}`);
        }
    } finally {
        await browser.close();
    }
}

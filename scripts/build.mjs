// Static site build: reads data/*.json and i18n/*.json and writes the finished
// pages to dist/, one per published language. Every piece of content is in the
// HTML itself; the browser JS only adds interactivity.
//
//   node scripts/build.mjs            -> dist/
//   build({ outDir })                 -> used by the tests
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, posix } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { html } from "./lib/html.mjs";
import { publishedLocales, translator } from "./lib/i18n.mjs";
import { boardSummary, relativeDay } from "./lib/github.mjs";
import { layout } from "../templates/layout.mjs";
import { homeBody } from "../templates/home.mjs";
import { notFoundBody } from "../templates/not-found.mjs";
import { homeHead, robots, sitemap } from "../templates/seo.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_FILES = ["site", "projects", "stack", "certifications", "experience"];
// Copied to dist/ as they are.
const STATIC_DIRS = ["css", "js", "assets"];

async function readJSON(path) {
    return JSON.parse(await readFile(path, "utf8"));
}

export async function loadContent(root = ROOT) {
    const data = {};
    for (const name of DATA_FILES) data[name] = await readJSON(join(root, "data", `${name}.json`));
    // Optional: written daily by .github/workflows/github-data.yml. Without it the
    // status board shows only the profile rows.
    data.github = await readJSON(join(root, "data", "github.json")).catch((err) => {
        if (err.code === "ENOENT") return null;
        throw err;
    });

    const files = (await readdir(join(root, "i18n"))).filter((f) => f.endsWith(".json"));
    const all = await Promise.all(files.map((f) => readJSON(join(root, "i18n", f))));
    // The default language (empty path, served at the site root) comes first.
    const locales = publishedLocales(all).sort((a, b) => a._meta.path.length - b._meta.path.length || a._meta.lang.localeCompare(b._meta.lang));
    if (locales[0]?._meta.path !== "") throw new Error("i18n: no published locale with an empty path (the default language)");
    return { data, locales, root };
}

// Live cells for the status board, from data/github.json.
function githubCells(github, t, htmlLang, now) {
    const summary = boardSummary(github);
    if (!summary) return null;
    const cells = [{ label: t("panel.repos"), value: String(summary.repoCount), span: 2 }];
    if (summary.lastActivity) {
        const { date, repo } = summary.lastActivity;
        const recent = Date.parse(now) - Date.parse(date) < 30 * 86_400_000;
        cells.push({
            label: t("panel.lastActivity"),
            value: relativeDay(date, now, htmlLang),
            detail: repo,
            span: 2,
            lamp: recent ? "ok" : "off",
            state: recent ? t("panel.activeState") : t("panel.idleState"),
        });
    }
    if (summary.mainLanguages.length) cells.push({ label: t("panel.mainLanguages"), value: summary.mainLanguages.join(" · "), span: 2 });
    return cells;
}

function context({ data, locales, root }, locale, now = new Date().toISOString()) {
    const site = data.site;
    const base = new URL(site.url).pathname; // "/portfolio/"
    const t = translator(locale);
    return {
        data,
        site,
        base,
        locales,
        locale,
        lang: locale._meta.lang,
        t,
        year: new Date().getFullYear(),
        homePath: (l) => base + l._meta.path,
        homeUrl: (l) => site.url + l._meta.path,
        root,
        // Filled in by the case-study and GitHub steps; null means "not available".
        caseStudyPath: () => null,
        board: githubCells(data.github, t, locale._meta.htmlLang, now),
    };
}

async function writePage(outDir, relPath, content) {
    const path = join(outDir, relPath);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, String(content));
}

export async function build({ outDir = join(ROOT, "dist"), root = ROOT } = {}) {
    const content = await loadContent(root);
    await rm(outDir, { recursive: true, force: true });
    await mkdir(outDir, { recursive: true });

    const pages = [];
    for (const locale of content.locales) {
        const ctx = context(content, locale);
        const relPath = posix.join(locale._meta.path, "index.html");
        await writePage(outDir, relPath, layout(ctx, {
            title: ctx.t("meta.title"),
            description: ctx.t("meta.description"),
            navPrefix: "",
            head: homeHead(ctx),
            suggestLanguages: true,
            body: homeBody(ctx),
        }));
        pages.push(relPath);
    }

    const ctx = context(content, content.locales[0]);
    await writePage(outDir, "404.html", layout(ctx, {
        title: `${ctx.t("notFound.title")} — ${ctx.site.shortName}`,
        description: ctx.t("notFound.text"),
        navPrefix: ctx.homePath(content.locales[0]),
        head: html`<meta name="robots" content="noindex" />`,
        body: notFoundBody(ctx),
    }));
    pages.push("404.html");

    await writePage(outDir, "sitemap.xml", sitemap(ctx));
    await writePage(outDir, "robots.txt", robots(ctx));

    for (const dir of STATIC_DIRS) await cp(join(root, dir), join(outDir, dir), { recursive: true });
    return { pages };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const started = performance.now();
    const { pages } = await build();
    console.log(`Built ${pages.length} pages in ${Math.round(performance.now() - started)} ms: ${pages.join(", ")}`);
}

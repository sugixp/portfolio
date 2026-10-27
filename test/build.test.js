// Builds the real site into a temp folder and checks that the content is in
// the HTML itself, i.e. readable without JavaScript.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build, loadContent } from "../scripts/build.mjs";
import { localize } from "../scripts/lib/localize.mjs";

let outDir;
let content;
const page = (rel) => readFile(join(outDir, rel), "utf8");

before(async () => {
    outDir = await mkdtemp(join(tmpdir(), "portfolio-build-"));
    await build({ outDir });
    content = await loadContent();
});

after(() => rm(outDir, { recursive: true, force: true }));

test("one page per published language", async () => {
    for (const locale of content.locales) {
        const htmlLang = locale._meta.htmlLang;
        assert.match(await page(join(locale._meta.path, "index.html")), new RegExp(`<html lang="${htmlLang}">`));
    }
});

test("every project, stack item, certification and experience is pre-rendered in each language", async () => {
    const { projects, stack, certifications, experience } = content.data;
    for (const locale of content.locales) {
        const lang = locale._meta.lang;
        const html = await page(join(locale._meta.path, "index.html"));
        for (const p of projects.projects) assert.ok(html.includes(`<h3>${p.title}</h3>`), `${lang}: project ${p.id}`);
        for (const g of stack.groups) for (const item of g.items) assert.ok(html.includes(`<li>${localize(item, lang)}</li>`), `${lang}: stack ${localize(item, lang)}`);
        for (const c of certifications.certifications) assert.ok(html.includes(localize(c.name, lang)), `${lang}: certification`);
        for (const e of experience.experience) assert.ok(html.includes(localize(e.title, lang)), `${lang}: experience`);
    }
});

test("the language switch is made of plain links", async () => {
    const html = await page("index.html");
    for (const locale of content.locales) {
        assert.ok(html.includes(`href="${new URL(content.data.site.url).pathname}${locale._meta.path}"`), locale._meta.lang);
    }
});

test("each page has a canonical URL and reciprocal hreflang links to every language", async () => {
    const homeUrl = (l) => content.data.site.url + l._meta.path;
    for (const locale of content.locales) {
        const html = await page(join(locale._meta.path, "index.html"));
        assert.ok(html.includes(`<link rel="canonical" href="${homeUrl(locale)}" />`), `${locale._meta.lang}: canonical`);
        for (const other of content.locales) {
            assert.ok(html.includes(`<link rel="alternate" hreflang="${other._meta.htmlLang}" href="${homeUrl(other)}" />`),
                `${locale._meta.lang}: hreflang ${other._meta.lang}`);
        }
        assert.ok(html.includes(`hreflang="x-default" href="${homeUrl(content.locales[0])}"`), `${locale._meta.lang}: x-default`);
    }
});

test("the Open Graph image of each page exists in the build", async () => {
    for (const locale of content.locales) {
        const html = await page(join(locale._meta.path, "index.html"));
        const image = html.match(/<meta property="og:image" content="([^"]+)"/)[1];
        assert.ok(image.startsWith(content.data.site.url), "absolute URL");
        await assert.doesNotReject(readFile(join(outDir, image.slice(content.data.site.url.length))), image);
    }
});

test("sitemap lists every language and 404 is not indexed", async () => {
    const xml = await page("sitemap.xml");
    for (const locale of content.locales) assert.ok(xml.includes(`<loc>${content.data.site.url}${locale._meta.path}</loc>`));
    assert.match(await page("404.html"), /<meta name="robots" content="noindex" \/>/);
});

test("the status board shows live GitHub cells when data/github.json exists", async (t) => {
    if (!content.data.github) return t.skip("no data/github.json");
    const html = await page("index.html");
    assert.ok(html.includes(`<p class="board-value">${content.data.github.repos.length}</p>`), "repository count");
    assert.match(html, /class="lamp lamp-(ok|off)" aria-hidden="true"><\/span>(ativo|pausado)/, "activity lamp with text");
});

test("draft case studies are not published: no page, no link, not in the sitemap", async () => {
    const drafts = content.data.projects.projects.filter((p) => p.caseStudy?.draft);
    const home = await page("index.html");
    for (const p of drafts) {
        await assert.rejects(readFile(join(outDir, "projects", p.id, "index.html")), `${p.id} page`);
        assert.ok(!home.includes(`/projects/${p.id}/`), `${p.id} link`);
        assert.ok(!(await page("sitemap.xml")).includes(`/projects/${p.id}/`), `${p.id} sitemap`);
    }
});

test("--drafts renders draft case studies for preview, marked noindex", async () => {
    const drafts = content.data.projects.projects.filter((p) => p.caseStudy?.draft);
    if (!drafts.length) return;
    const previewDir = await mkdtemp(join(tmpdir(), "portfolio-drafts-"));
    try {
        await build({ outDir: previewDir, drafts: true });
        for (const locale of content.locales) {
            const file = join(previewDir, locale._meta.path, "projects", drafts[0].id, "index.html");
            const html = await readFile(file, "utf8");
            assert.match(html, /<meta name="robots" content="noindex" \/>/);
            assert.match(html, /class="flow"/, "architecture diagram");
        }
        assert.ok((await readFile(join(previewDir, "index.html"), "utf8")).includes("data-case-study"), "card link");
    } finally {
        await rm(previewDir, { recursive: true, force: true });
    }
});

test("screenshot previews ship as AVIF and WebP, lazy-loaded, with dimensions", async () => {
    const shots = content.data.projects.projects.filter((p) => p.preview?.type === "screenshot");
    const html = await page("index.html");
    for (const p of shots) {
        assert.ok(html.includes(`assets/projects/${p.id}-640.avif 640w`), `${p.id} avif`);
        assert.ok(html.includes(`assets/projects/${p.id}-1280.webp 1280w`), `${p.id} webp`);
        await assert.doesNotReject(readFile(join(outDir, "assets", "projects", `${p.id}-1280.avif`)));
    }
    if (shots.length) assert.match(html, /<img src="[^"]+-640\.webp" alt="[^"]+" width="1280" height="800" loading="lazy" decoding="async" \/>/);
});

test("each language has a one-column CV page built from the same data", async () => {
    const { projects, experience } = content.data;
    for (const locale of content.locales) {
        const lang = locale._meta.lang;
        const html = await page(join(locale._meta.path, "cv", "index.html"));
        assert.match(html, /<article class="cv"/, `${lang}: cv article`);
        for (const p of projects.projects) assert.ok(html.includes(`<strong>${p.title}</strong>`), `${lang}: ${p.id}`);
        for (const e of experience.experience) assert.ok(html.includes(localize(e.title, lang)), `${lang}: ${localize(e.title, lang)}`);
        assert.ok(html.includes(`href="${new URL(content.data.site.url).pathname}${locale._meta.path}cv/${locale.cv.fileName}"`), `${lang}: PDF link`);
    }
});

test("the hero download button points at the PDF of the same language", async () => {
    for (const locale of content.locales) {
        const html = await page(join(locale._meta.path, "index.html"));
        assert.ok(html.includes(`cv/${locale.cv.fileName}" class="btn" download>`), locale._meta.lang);
    }
    assert.ok((await page("sitemap.xml")).includes(`${content.data.site.url}cv/</loc>`));
});

test("the timeline and the CV list experience most recent first", async () => {
    const starts = (html, selector) => [...html.matchAll(selector)].map((m) => Number(m[1]));
    const isDescending = (list) => list.every((v, i) => i === 0 || list[i - 1] >= v);
    for (const locale of content.locales) {
        const home = await page(join(locale._meta.path, "index.html"));
        const timeline = starts(home, /<p class="timeline-date mono">(\d{4})–/g);
        assert.ok(timeline.length > 1 && isDescending(timeline), `${locale._meta.lang} timeline: ${timeline}`);
        const cv = await page(join(locale._meta.path, "cv", "index.html"));
        const cvDates = starts(cv, /<span class="cv-entry-meta">(\d{4})–/g);
        assert.ok(cvDates.length > 1, "cv dates found");
        // Projects have no dates; education and experience blocks are each descending.
        assert.ok(isDescending(cvDates.slice(-2)), `${locale._meta.lang} cv experience: ${cvDates}`);
    }
});

test("dateRange shows the expected completion year when there is one", async () => {
    const { dateRange } = await import("../templates/parts.mjs");
    const { translator } = await import("../scripts/lib/i18n.mjs");
    const t = translator(content.locales.find((l) => l._meta.lang === "pt"));
    assert.equal(dateRange(t, { start: "2016", end: "2021" }), "2016–2021");
    assert.equal(dateRange(t, { start: "2025", end: null }), "2025–atual");
    assert.equal(dateRange(t, { start: "2025", end: null, expectedEnd: "2027" }), "2025 – previsão de conclusão 2027");
    assert.equal(dateRange(t, { start: "2025", end: null, expectedEnd: "2027-12" }), "2025 – previsão de conclusão dez/2027");
    const en = translator(content.locales.find((l) => l._meta.lang === "en"));
    assert.equal(dateRange(en, { start: "2025", end: null, expectedEnd: "2027-12" }), "2025 – expected Dec 2027");
});

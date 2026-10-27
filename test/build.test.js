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

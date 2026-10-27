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
        for (const g of stack.groups) for (const item of g.items) assert.ok(html.includes(`<li>${item}</li>`), `${lang}: stack ${item}`);
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

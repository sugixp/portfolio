import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { keyPaths, plural, publishedLocales, translator } from "../scripts/lib/i18n.mjs";

const messages = {
    _meta: { lang: "pt" },
    hero: { title: "Olá, {name}" },
    list: [{ label: "a" }],
};

test("translator resolves dotted keys and fills placeholders", () => {
    const t = translator(messages);
    assert.equal(t("hero.title", { name: "mundo" }), "Olá, mundo");
    assert.deepEqual(t("list"), [{ label: "a" }]);
});

test("translator throws on a missing key", () => {
    assert.throws(() => translator(messages)("hero.nope"), /missing key "hero.nope"/);
});

test("plural picks the singular only for 1", () => {
    const forms = { one: "1 projeto", other: "{n} projetos" };
    assert.equal(plural(forms, 1), "1 projeto");
    assert.equal(plural(forms, 0), "0 projetos");
    assert.equal(plural(forms, 3), "3 projetos");
});

test("publishedLocales hides locales marked as not reviewed", () => {
    const locales = [{ _meta: { lang: "pt" } }, { _meta: { lang: "ja", reviewed: false } }];
    assert.deepEqual(publishedLocales(locales).map((m) => m._meta.lang), ["pt"]);
});

test("every locale in i18n/ has exactly the same keys as pt.json", async () => {
    const files = (await readdir("i18n")).filter((f) => f.endsWith(".json"));
    const load = async (f) => JSON.parse(await readFile(`i18n/${f}`, "utf8"));
    const reference = keyPaths(await load("pt.json")).sort();
    for (const file of files) {
        assert.deepEqual(keyPaths(await load(file)).sort(), reference, `${file} differs from pt.json`);
    }
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { localize, normalizeLang } from "../js/lib/localize.js";

test("localize returns plain strings unchanged", () => {
    assert.equal(localize("Docker", "en"), "Docker");
});

test("localize picks the requested language", () => {
    assert.equal(localize({ pt: "olá", en: "hello" }, "en"), "hello");
});

test("localize falls back to Portuguese when a translation is missing", () => {
    assert.equal(localize({ pt: "olá" }, "en"), "olá");
});

test("localize never returns undefined", () => {
    assert.equal(localize(undefined, "pt"), "");
    assert.equal(localize({}, "en"), "");
});

test("normalizeLang accepts browser-style tags", () => {
    assert.equal(normalizeLang("en-US"), "en");
    assert.equal(normalizeLang("pt-BR"), "pt");
});

test("normalizeLang rejects unsupported languages", () => {
    assert.equal(normalizeLang("ja"), null);
    assert.equal(normalizeLang(null), null);
});

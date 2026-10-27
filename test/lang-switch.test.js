import { test } from "node:test";
import assert from "node:assert/strict";
import { preferredLang } from "../js/lang-switch.js";

const available = ["pt", "en"];

test("a saved choice wins over the browser languages", () => {
    assert.equal(preferredLang(available, "pt", ["en-US"]), "pt");
});

test("without a saved choice, the first supported browser language is used", () => {
    assert.equal(preferredLang(available, null, ["ja-JP", "en-GB", "pt-BR"]), "en");
});

test("returns null when nothing matches", () => {
    assert.equal(preferredLang(available, null, ["ja", "de"]), null);
    assert.equal(preferredLang(available, null, []), null);
});

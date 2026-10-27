import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, html, jsonForScript, raw } from "../scripts/lib/html.mjs";

test("escapeHtml escapes the five HTML-significant characters", () => {
    assert.equal(escapeHtml(`<a href="x" title='y'>&</a>`), "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;");
});

test("html escapes interpolated text and attributes", () => {
    const evil = `"><script>alert(1)</script>`;
    assert.equal(String(html`<p title="${evil}">${evil}</p>`),
        `<p title="&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;">&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;</p>`);
});

test("html keeps nested html`` fragments and joins arrays", () => {
    const items = ["a", "<b>"].map((x) => html`<li>${x}</li>`);
    assert.equal(String(html`<ul>${items}</ul>`), "<ul><li>a</li><li>&lt;b&gt;</li></ul>");
});

test("html renders null, undefined and false as nothing, but keeps 0", () => {
    assert.equal(String(html`[${null}${undefined}${false}${0}]`), "[0]");
});

test("raw marks trusted markup as safe", () => {
    assert.equal(String(html`${raw("<br>")}`), "<br>");
});

test("jsonForScript cannot close the surrounding script tag", () => {
    assert.equal(String(jsonForScript({ a: "</script>" })), '{"a":"\\u003c/script>"}');
});

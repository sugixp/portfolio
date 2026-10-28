import { test } from "node:test";
import assert from "node:assert/strict";
import { complete, createHistory, parse, run } from "../js/terminal-core.js";

const data = {
    s: {
        help: { help: "h", whoami: "w", projects: "p", open: "o", stack: "s", contact: "c", cv: "v", lang: "l", theme: "t", clear: "x" },
        downloading: "downloading",
        openHint: "open <name>",
        usage: "usage: {usage}",
        unknownProject: "not found: {name}",
        opening: "opening {name}",
        notFound: "command not found: {cmd}",
        langSame: "already in {lang}",
        themeSet: "theme: {theme}",
        themeSame: "already {theme}",
    },
    whoami: ["Henrique", "dev"],
    cv: "/portfolio/cv/resume.pdf",
    projects: [
        { id: "custompc", title: "custompc", status: "live", href: "https://github.com/x/custompc", caseStudy: false },
        { id: "task-manager", title: "task-manager", status: "stable", href: "/portfolio/projects/task-manager/", caseStudy: true },
        { id: "currency-converter", title: "currency-converter", status: "stable", href: "https://github.com/x/currency-converter", caseStudy: false },
    ],
    stack: [{ title: "Languages", items: ["Python", "SQL"] }],
    contact: [{ label: "email", text: "a@b.c", href: "mailto:a@b.c" }],
    langs: [
        { code: "pt", label: "Português", href: "/portfolio/", current: true },
        { code: "en", label: "English", href: "/portfolio/en/", current: false },
    ],
};

test("parse splits the command and its arguments, ignoring extra spaces", () => {
    assert.deepEqual(parse("  OPEN   custompc "), { name: "open", args: ["custompc"] });
});

test("help lists every command", () => {
    assert.equal(run("help", data).lines.length, 10);
});

test("cv asks the UI to download the PDF", () => {
    assert.deepEqual(run("cv", data).action, { type: "download", href: "/portfolio/cv/resume.pdf" });
});

test("open finds a project and asks the UI to open it", () => {
    const result = run("open task-manager", data);
    assert.deepEqual(result.action, { type: "open", href: "/portfolio/projects/task-manager/", caseStudy: true });
    assert.deepEqual(run("open nope", data).lines, [["not found: nope"]]);
    assert.deepEqual(run("open", data).lines, [["usage: open <projeto>"]]);
});

test("lang navigates to the other language and refuses the current one", () => {
    assert.deepEqual(run("lang en", data).action, { type: "navigate", href: "/portfolio/en/" });
    assert.equal(run("lang pt", data).action, undefined);
});

test("theme validates its argument and skips a no-op", () => {
    assert.deepEqual(run("theme light", data, { theme: "dark" }).action, { type: "theme", value: "light" });
    assert.equal(run("theme dark", data, { theme: "dark" }).action, undefined);
    assert.deepEqual(run("theme blue", data).lines, [["usage: theme dark | theme light"]]);
});

test("contact output contains links as parts", () => {
    assert.deepEqual(run("contact", data).lines[0][1], { text: "a@b.c", href: "mailto:a@b.c" });
});

test("unknown commands point to help", () => {
    assert.deepEqual(run("sudo rm", data).lines, [["command not found: sudo"]]);
});

test("complete fills unique commands and arguments", () => {
    assert.equal(complete("he", data), "help ");
    assert.equal(complete("t", data), "theme ");
});

test("complete resolves arguments, and leaves ambiguous input alone", () => {
    assert.equal(complete("open task-m", data), "open task-manager");
    assert.equal(complete("open cu", data), "open cu"); // custompc, currency-converter
    assert.equal(complete("theme l", data), "theme light");
    assert.equal(complete("c", data), "c"); // contact, cv, clear
    assert.equal(complete("cv", data), "cv ");
});

test("history walks back and forth and skips duplicates", () => {
    const h = createHistory();
    h.push("help");
    h.push("help");
    h.push("stack");
    assert.equal(h.up(), "stack");
    assert.equal(h.up(), "help");
    assert.equal(h.up(), "help");
    assert.equal(h.down(), "stack");
    assert.equal(h.down(), "");
});

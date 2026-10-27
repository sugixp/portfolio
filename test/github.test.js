import { test } from "node:test";
import assert from "node:assert/strict";
import { boardSummary, mainLanguages, relativeDay, simplifyEvent, summarizeLanguages } from "../scripts/lib/github.mjs";

test("summarizeLanguages sums bytes across repositories and sorts by size", () => {
    const result = summarizeLanguages([{ Python: 300, HTML: 100 }, { Python: 500 }, {}]);
    assert.deepEqual(result, [
        { name: "Python", bytes: 800, share: 0.889 },
        { name: "HTML", bytes: 100, share: 0.111 },
    ]);
});

test("summarizeLanguages handles no data", () => {
    assert.deepEqual(summarizeLanguages([]), []);
});

test("simplifyEvent keeps known events and drops the rest", () => {
    const push = { type: "PushEvent", repo: { name: "sugixp/portfolio" }, created_at: "2026-10-27T10:00:00Z", payload: { size: 3 } };
    assert.deepEqual(simplifyEvent(push), { type: "push", repo: "portfolio", date: "2026-10-27T10:00:00Z", commits: 3 });
    assert.equal(simplifyEvent({ type: "WatchEvent", repo: { name: "a/b" }, created_at: "x" }), null);
});

test("boardSummary picks the most recent commit and the top language", () => {
    const summary = boardSummary({
        repos: [
            { name: "old", lastCommit: { date: "2026-01-01T00:00:00Z" } },
            { name: "empty", lastCommit: null },
            { name: "new", lastCommit: { date: "2026-10-20T00:00:00Z" } },
        ],
        languages: [],
    });
    assert.deepEqual(summary, { repoCount: 3, lastActivity: { date: "2026-10-20T00:00:00Z", repo: "new" }, mainLanguages: [] });
});

test("boardSummary returns null without data, so the board falls back to the static rows", () => {
    assert.equal(boardSummary(null), null);
    assert.equal(boardSummary({ repos: [] }), null);
});

test("mainLanguages ranks by repositories, not bytes", () => {
    const github = {
        repos: [{ language: "Python" }, { language: "Python" }, { language: "Jupyter Notebook" }, { language: "C#" }, { language: null }],
        languages: [{ name: "Jupyter Notebook", bytes: 1e6 }, { name: "C#", bytes: 500 }, { name: "Python", bytes: 100 }],
    };
    assert.deepEqual(mainLanguages(github), ["Python", "Jupyter Notebook"]);
    assert.deepEqual(mainLanguages(github, 3), ["Python", "Jupyter Notebook", "C#"]);
});

test("relativeDay formats in the page language", () => {
    const now = "2026-10-27T12:00:00Z";
    assert.equal(relativeDay("2026-10-27T08:00:00Z", now, "pt-BR"), "hoje");
    assert.equal(relativeDay("2026-10-24T12:00:00Z", now, "en"), "3 days ago");
    assert.equal(relativeDay("2026-07-27T12:00:00Z", now, "en"), "3 months ago");
});

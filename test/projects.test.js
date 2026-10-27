import { test } from "node:test";
import assert from "node:assert/strict";
import { collectTechs, sortProjects } from "../scripts/lib/projects.mjs";

const projects = [
    { id: "a", featured: false, tech: ["Python", "SQLite"] },
    { id: "b", featured: true, tech: ["FastAPI", "Python"] },
    { id: "c", featured: false, tech: ["docker"] },
    { id: "d", featured: true, tech: ["AWS"] },
];

test("sortProjects puts featured first and keeps file order otherwise", () => {
    assert.deepEqual(sortProjects(projects).map((p) => p.id), ["b", "d", "a", "c"]);
});

test("sortProjects does not mutate its input", () => {
    const copy = structuredClone(projects);
    sortProjects(projects);
    assert.deepEqual(projects, copy);
});

test("collectTechs returns unique techs, case-insensitively sorted", () => {
    assert.deepEqual(collectTechs(projects), ["AWS", "docker", "FastAPI", "Python", "SQLite"]);
});

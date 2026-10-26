import { test } from "node:test";
import assert from "node:assert/strict";
import { collectTechs, filterByTech, sortProjects } from "../js/lib/projects.js";

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

test("filterByTech returns matching projects", () => {
    assert.deepEqual(filterByTech(projects, "Python").map((p) => p.id), ["a", "b"]);
});

test("filterByTech returns everything when no tech is selected", () => {
    assert.equal(filterByTech(projects, null), projects);
});

test("filterByTech returns an empty list for an unknown tech", () => {
    assert.deepEqual(filterByTech(projects, "Rust"), []);
});

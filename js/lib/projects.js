// Pure project-list logic: ordering and technology filtering.

/** Featured projects first; otherwise keeps the order of projects.json. */
export function sortProjects(projects) {
    return projects
        .map((project, index) => ({ project, index }))
        .sort((a, b) => Number(b.project.featured) - Number(a.project.featured) || a.index - b.index)
        .map(({ project }) => project);
}

/** Unique technologies across all projects, alphabetically. */
export function collectTechs(projects) {
    const techs = new Set(projects.flatMap((p) => p.tech));
    return [...techs].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

/** Projects that use the given technology; all of them when tech is null. */
export function filterByTech(projects, tech) {
    if (!tech) return projects;
    return projects.filter((p) => p.tech.includes(tech));
}

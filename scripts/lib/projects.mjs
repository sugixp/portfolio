// Project-list ordering and the technology list behind the filter. Pure, used at build time.

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

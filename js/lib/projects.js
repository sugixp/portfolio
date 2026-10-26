// Pure project-list logic.

/** Featured projects first; otherwise keeps the order of projects.json. */
export function sortProjects(projects) {
    return projects
        .map((project, index) => ({ project, index }))
        .sort((a, b) => Number(b.project.featured) - Number(a.project.featured) || a.index - b.index)
        .map(({ project }) => project);
}


// Projects section: cards rendered from data/projects.json.
import { h } from "../lib/dom.js";
import { localize } from "../lib/localize.js";
import { sortProjects } from "../lib/projects.js";
import { strings } from "../lib/strings.js";
import { getLang, onLangChange } from "../lang.js";

function statusDot(status) {
    const modifier = { stable: "dot-muted", archived: "dot-muted", "in-progress": "dot-amber" }[status];
    return h("span", { class: modifier ? `dot ${modifier}` : "dot", "aria-hidden": "true" });
}

function projectLink(href, label, title) {
    return h(
        "a",
        { href, target: "_blank", rel: "noopener" },
        label,
        h("span", { class: "visually-hidden" }, ` — ${title}`),
        h("span", { "aria-hidden": "true" }, " →"),
    );
}

function projectCard(project, lang) {
    const s = strings(lang);
    return h(
        "article",
        { class: project.featured ? "project-card project-card-featured" : "project-card" },
        h(
            "div",
            { class: "project-top" },
            project.featured && h("span", { class: "project-badge" }, s.featured),
            h("span", { class: "project-status" }, statusDot(project.status), h("span", {}, s.status[project.status])),
        ),
        h("h3", {}, project.title),
        h("p", {}, localize(project.description, lang)),
        h("ul", { class: "tag-list" }, project.tech.map((t) => h("li", {}, t))),
        h(
            "div",
            { class: "project-links" },
            project.links.repo && projectLink(project.links.repo, s.repo, project.title),
            project.links.demo && projectLink(project.links.demo, s.demo, project.title),
        ),
    );
}

export function mountProjects(root, data) {
    const projects = sortProjects(data.projects);
    const grid = h("div", { class: "projects-grid" });

    function renderGrid() {
        const lang = getLang();
        grid.replaceChildren(...projects.map((p) => projectCard(p, lang)));
    }

    renderGrid();
    root.replaceChildren(grid);
    onLangChange(renderGrid);
}

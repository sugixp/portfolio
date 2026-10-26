// Projects section: cards rendered from data/projects.json plus a technology filter.
import { h } from "../lib/dom.js";
import { localize } from "../lib/localize.js";
import { collectTechs, filterByTech, sortProjects } from "../lib/projects.js";
import { strings } from "../lib/strings.js";
import { getLang, onLangChange } from "../lang.js";

const PARAM = "tech";

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

function readTechFromURL(techs) {
    const tech = new URLSearchParams(location.search).get(PARAM);
    return techs.includes(tech) ? tech : null;
}

function writeTechToURL(tech) {
    const url = new URL(location.href);
    if (tech) url.searchParams.set(PARAM, tech);
    else url.searchParams.delete(PARAM);
    history.replaceState(null, "", url);
}

export function mountProjects(root, data) {
    const projects = sortProjects(data.projects);
    const techs = collectTechs(projects);
    let selected = readTechFromURL(techs);

    const filter = h("div", { class: "filter", role: "group" });
    const count = h("p", { class: "filter-count", "aria-live": "polite" });
    const grid = h("div", { class: "projects-grid" });

    function renderGrid() {
        const lang = getLang();
        const visible = filterByTech(projects, selected);
        grid.replaceChildren(...visible.map((p) => projectCard(p, lang)));
        count.textContent = strings(lang).projectCount(visible.length);
    }

    function select(tech) {
        selected = tech;
        filter.querySelectorAll("button").forEach((btn) => {
            btn.setAttribute("aria-pressed", String((btn.dataset.tech || null) === selected));
        });
        writeTechToURL(selected);
        renderGrid();
    }

    function renderFilter() {
        const s = strings(getLang());
        filter.setAttribute("aria-label", s.filterLabel);
        const button = (tech, label) =>
            h(
                "button",
                {
                    type: "button",
                    class: "filter-btn",
                    "data-tech": tech ?? "",
                    "aria-pressed": String(tech === selected),
                    onclick: () => select(tech),
                },
                label,
            );
        filter.replaceChildren(button(null, s.filterAll), ...techs.map((t) => button(t, t)));
    }

    renderFilter();
    renderGrid();
    root.replaceChildren(h("div", { class: "filter-bar" }, filter, count), grid);

    onLangChange(() => {
        renderFilter();
        renderGrid();
    });
}

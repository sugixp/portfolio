// Entry point. Each section loads its own data file independently:
// if one fails, its static fallback stays on screen and the rest of the
// page still renders.
import { loadJSON } from "./lib/dom.js";
import { initLang } from "./lang.js";
import { mountProjects } from "./render/projects.js";

const SECTIONS = [{ root: "projects-root", data: "data/projects.json", mount: mountProjects }];

initLang();

for (const section of SECTIONS) {
    const root = document.getElementById(section.root);
    if (!root) continue;

    loadJSON(section.data)
        .then((data) => {
            section.mount(root, data);
            root.removeAttribute("aria-busy");
        })
        .catch((err) => {
            root.removeAttribute("aria-busy");
            console.error(`[portfolio] ${section.data} não carregou; mantendo fallback.`, err);
        });
}

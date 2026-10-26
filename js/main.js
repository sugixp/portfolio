// Entry point. Each section loads its own data file independently:
// if one fails, its static fallback stays on screen and the rest of the
// page still renders.
import { loadJSON } from "./lib/dom.js";
import { initLang } from "./lang.js";
import { mountProjects } from "./render/projects.js";
import { mountStack } from "./render/stack.js";
import { mountCertifications } from "./render/certifications.js";
import { mountExperience } from "./render/experience.js";

const SECTIONS = [
    { root: "projects-root", data: "data/projects.json", mount: mountProjects },
    { root: "stack-root", data: "data/stack.json", mount: mountStack },
    { root: "certifications-root", data: "data/certifications.json", mount: mountCertifications },
    { root: "experience-root", data: "data/experience.json", mount: mountExperience },
];

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

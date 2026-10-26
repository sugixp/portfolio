// Experience timeline, rendered from data/experience.json.
import { h } from "../lib/dom.js";
import { localize } from "../lib/localize.js";
import { strings } from "../lib/strings.js";
import { getLang, onLangChange } from "../lang.js";

function render(root, data, lang) {
    const s = strings(lang);
    root.replaceChildren(
        ...data.experience.map((item) =>
            h(
                "li",
                { class: "timeline-item" },
                h("div", { class: "timeline-marker", "aria-hidden": "true" }),
                h(
                    "div",
                    { class: "timeline-content" },
                    h("p", { class: "timeline-date" }, `${item.start} — ${item.end ?? s.present}`),
                    h("h3", {}, localize(item.title, lang)),
                    h("p", {}, localize(item.description, lang)),
                ),
            ),
        ),
    );
}

export function mountExperience(root, data) {
    render(root, data, getLang());
    onLangChange((lang) => render(root, data, lang));
}

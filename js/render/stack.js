// Stack section, rendered from data/stack.json.
import { h } from "../lib/dom.js";
import { localize } from "../lib/localize.js";
import { getLang, onLangChange } from "../lang.js";

function render(root, data, lang) {
    root.replaceChildren(
        ...data.groups.map((group) =>
            h(
                "div",
                { class: "stack-group" },
                h("h3", {}, localize(group.title, lang)),
                h(
                    "ul",
                    { class: group.planned ? "tag-list tag-list-mono tag-list-planned" : "tag-list tag-list-mono" },
                    group.items.map((item) => h("li", {}, item)),
                ),
            ),
        ),
    );
}

export function mountStack(root, data) {
    render(root, data, getLang());
    onLangChange((lang) => render(root, data, lang));
}

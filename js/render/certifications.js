// Certifications section, rendered from data/certifications.json.
import { h } from "../lib/dom.js";
import { localize } from "../lib/localize.js";
import { getLang, onLangChange } from "../lang.js";

function certName(cert, lang) {
    const name = localize(cert.name, lang);
    if (!cert.url) return name;
    return h("a", { href: cert.url, target: "_blank", rel: "noopener" }, name);
}

function render(root, data, lang) {
    root.replaceChildren(
        ...data.certifications.map((cert) =>
            h(
                "div",
                { class: "cert-item" },
                h("span", { class: "cert-check", "aria-hidden": "true" }, "✓"),
                h(
                    "div",
                    {},
                    h("p", { class: "cert-name" }, certName(cert, lang)),
                    h("p", { class: "cert-meta" }, localize(cert.meta, lang)),
                ),
            ),
        ),
    );
}

export function mountCertifications(root, data) {
    render(root, data, getLang());
    onLangChange((lang) => render(root, data, lang));
}

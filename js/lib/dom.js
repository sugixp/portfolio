// Tiny element builder. Content is always set through textContent/attributes,
// never innerHTML, so data from the JSON files can't inject markup.

/**
 * h("a", { href: "/", class: "link" }, "text", childNode, [more, children])
 * Attributes set to null/undefined/false are skipped; true sets an empty attribute.
 */
export function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [name, value] of Object.entries(attrs)) {
        if (value == null || value === false) continue;
        if (name.startsWith("on") && typeof value === "function") {
            el.addEventListener(name.slice(2).toLowerCase(), value);
        } else {
            el.setAttribute(name, value === true ? "" : String(value));
        }
    }
    append(el, children);
    return el;
}

function append(el, children) {
    for (const child of children) {
        if (child == null || child === false) continue;
        if (Array.isArray(child)) append(el, child);
        else el.append(child instanceof Node ? child : String(child));
    }
}

/** Fetches and parses a JSON file; rejects on HTTP errors too. */
export async function loadJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return res.json();
}

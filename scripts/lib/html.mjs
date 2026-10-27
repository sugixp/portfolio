// HTML templating for the build. Every interpolated value is escaped unless it
// is itself the result of html``, so text from the data files can never become
// markup (the build-time equivalent of using textContent instead of innerHTML).

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/** Markup that is already safe. Only html`` and raw() create it. */
class SafeHtml {
    constructor(value) {
        this.value = value;
    }
    toString() {
        return this.value;
    }
}

/** Marks a trusted string (e.g. serialized JSON-LD) as markup. Never pass data through it. */
export function raw(value) {
    return new SafeHtml(String(value));
}

function render(value) {
    if (value == null || value === false) return "";
    if (value instanceof SafeHtml) return value.value;
    if (Array.isArray(value)) return value.map(render).join("");
    return escapeHtml(value);
}

/** Tagged template: html`<p>${text}</p>`. Arrays are joined; null/false render nothing. */
export function html(strings, ...values) {
    let out = strings[0];
    values.forEach((value, i) => {
        out += render(value) + strings[i + 1];
    });
    return new SafeHtml(out);
}

/** JSON for an inline <script type="application/ld+json">, safe against "</script>". */
export function jsonForScript(data) {
    return raw(JSON.stringify(data).replace(/</g, "\\u003c"));
}

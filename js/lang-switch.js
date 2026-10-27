// The language switch is a set of plain links to /, /en/, ... and works without JS.
// This only carries the current filter and section over to the other language
// and remembers the choice.
export const STORAGE_KEY = "portfolio-lang";

export function savePreference(lang) {
    try {
        localStorage.setItem(STORAGE_KEY, lang);
    } catch {
        /* localStorage indisponível — segue sem persistir preferência */
    }
}

export function initLangSwitch() {
    for (const link of document.querySelectorAll("[data-lang-link]")) {
        link.addEventListener("click", () => {
            // Same section ids on every language page, so #projetos still works.
            const target = new URL(link.href);
            target.search = location.search;
            target.hash = location.hash;
            link.href = target.href;
            savePreference(link.hreflang.slice(0, 2));
        });
    }
}

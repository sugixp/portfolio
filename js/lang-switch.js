// The language switch is a set of plain links to /, /en/, ... and works without JS.
// This carries the current filter and section over to the other language,
// remembers the choice, and offers (never forces) the visitor's preferred language.
export const STORAGE_KEY = "portfolio-lang";

function readPreference() {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null; /* localStorage indisponível */
    }
}

export function savePreference(lang) {
    try {
        localStorage.setItem(STORAGE_KEY, lang);
    } catch {
        /* localStorage indisponível — segue sem persistir preferência */
    }
}

/**
 * First language the visitor prefers that this site has: the saved choice,
 * otherwise the browser's list in order. Returns null when nothing matches.
 */
export function preferredLang(available, saved, browserLangs) {
    const candidates = saved ? [saved] : browserLangs;
    for (const tag of candidates) {
        const code = String(tag).toLowerCase().slice(0, 2);
        if (available.includes(code)) return code;
    }
    return null;
}

function offerPreferredLanguage() {
    const current = document.documentElement.lang.slice(0, 2);
    const notices = [...document.querySelectorAll("[data-suggest-lang]")];
    if (!notices.length) return;

    const available = [current, ...notices.map((el) => el.dataset.suggestLang)];
    const lang = preferredLang(available, readPreference(), navigator.languages ?? [navigator.language]);
    const notice = notices.find((el) => el.dataset.suggestLang === lang);
    if (!notice) return;

    notice.hidden = false;
    notice.querySelector("[data-dismiss]").addEventListener("click", () => {
        // Staying here counts as choosing this language.
        savePreference(current);
        notice.remove();
    });
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
    offerPreferredLanguage();
}

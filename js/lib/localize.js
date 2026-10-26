// Pure helpers for bilingual content. No DOM access, so they run in Node tests.

export const LANGS = ["pt", "en"];
export const DEFAULT_LANG = "pt";

/**
 * Resolves a "localized" value from the data files.
 * Accepts a plain string (language-neutral) or { pt, en }.
 * Falls back to Portuguese, then to an empty string, so a missing
 * translation never renders "undefined".
 */
export function localize(value, lang) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    return value[lang] ?? value[DEFAULT_LANG] ?? "";
}

/** Returns lang if supported, otherwise null. */
export function normalizeLang(lang) {
    if (typeof lang !== "string") return null;
    const short = lang.toLowerCase().slice(0, 2);
    return LANGS.includes(short) ? short : null;
}

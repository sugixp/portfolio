// Resolves the bilingual values found in data/*.json. Pure, used at build time.

export const DEFAULT_LANG = "pt";

/**
 * Accepts a plain string (language-neutral) or { pt, en }.
 * Falls back to Portuguese, then to an empty string, so a missing
 * translation never renders "undefined".
 */
export function localize(value, lang) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    return value[lang] ?? value[DEFAULT_LANG] ?? "";
}

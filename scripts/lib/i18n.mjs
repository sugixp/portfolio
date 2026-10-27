// Interface strings from i18n/<lang>.json. Pure functions, used at build time.

/**
 * Returns a lookup function for one locale: t("projects.title").
 * A missing key throws, so a typo fails the build instead of shipping
 * an empty heading. "{name}" placeholders are filled from vars.
 */
export function translator(messages) {
    return function t(key, vars = {}) {
        const value = key.split(".").reduce((node, part) => node?.[part], messages);
        if (value === undefined) throw new Error(`i18n: missing key "${key}" for "${messages._meta?.lang}"`);
        if (typeof value !== "string") return value;
        return value.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
    };
}

/** Picks the "one" or "other" form of a { one, other } entry. */
export function plural(forms, n) {
    return (n === 1 ? forms.one : forms.other).replace("{n}", String(n));
}

/** Dotted paths of every leaf in a messages object, for comparing locales. */
export function keyPaths(node, prefix = "") {
    if (node === null || typeof node !== "object") return [prefix];
    if (Array.isArray(node)) return [`${prefix}[${node.length}]`, ...node.flatMap((item, i) => keyPaths(item, `${prefix}[${i}]`))];
    return Object.entries(node).flatMap(([key, value]) => keyPaths(value, prefix ? `${prefix}.${key}` : key));
}

/** Locales that may be published: "reviewed": false keeps a draft translation off the site. */
export function publishedLocales(locales) {
    return locales.filter((messages) => messages._meta.reviewed !== false);
}

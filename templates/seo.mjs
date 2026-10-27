// Search and link-preview metadata: canonical URL, hreflang alternates, Open Graph,
// Twitter card, JSON-LD, plus sitemap.xml and robots.txt.
import { html, jsonForScript } from "../scripts/lib/html.mjs";
import { OG_SIZE } from "./og-image.mjs";

/**
 * <head> additions for a page that exists in every published language.
 * page.relPath is the path below each language root ("" for home,
 * "projects/x/" for a case study).
 */
export function pageHead(ctx, page = {}) {
    const { t, site, locale, locales } = ctx;
    const relPath = page.relPath ?? "";
    const urlFor = (l) => ctx.homeUrl(l) + relPath;
    const url = urlFor(locale);
    const title = page.title ?? t("meta.title");
    const description = page.description ?? t("meta.description");
    const image = `${site.url}assets/og/og-${locale._meta.lang}.png`;
    const person = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: site.name,
        url,
        jobTitle: t("hero.role"),
        email: `mailto:${site.email}`,
        sameAs: [site.links.github, site.links.linkedin],
        address: { "@type": "PostalAddress", addressLocality: "Curitiba", addressCountry: "BR" },
    };

    return html`${page.noindex ? html`<meta name="robots" content="noindex" />
    ` : ""}<link rel="canonical" href="${url}" />
    ${locales.map((l) => html`<link rel="alternate" hreflang="${l._meta.htmlLang}" href="${urlFor(l)}" />
    `)}<link rel="alternate" hreflang="x-default" href="${urlFor(locales[0])}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${site.shortName}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="${OG_SIZE.width}" />
    <meta property="og:image:height" content="${OG_SIZE.height}" />
    <meta property="og:image:alt" content="${t("meta.ogImageAlt")}" />
    <meta property="og:locale" content="${locale._meta.ogLocale}" />
    ${locales.filter((l) => l !== locale).map((l) => html`<meta property="og:locale:alternate" content="${l._meta.ogLocale}" />
    `)}<meta name="twitter:card" content="summary_large_image" />
    ${relPath === "" ? html`<script type="application/ld+json">${jsonForScript(person)}</script>` : ""}`;
}

/** sitemap.xml: every published page in every language, cross-linked. */
export function sitemap(ctx, relPaths = [""]) {
    const entries = relPaths.flatMap((relPath) => {
        const urlFor = (l) => ctx.homeUrl(l) + relPath;
        const alternates = ctx.locales.map((l) => html`    <xhtml:link rel="alternate" hreflang="${l._meta.htmlLang}" href="${urlFor(l)}"/>
`);
        return ctx.locales.map((l) => html`  <url>
    <loc>${urlFor(l)}</loc>
${alternates}    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(ctx.locales[0])}"/>
  </url>
`);
    });
    return html`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}</urlset>
`;
}

/**
 * Crawlers only read robots.txt at the root of the host (sugixp.github.io/robots.txt),
 * so on a project site this file takes effect only with a custom domain. It is
 * kept so that move needs no change; the sitemap is submitted in Search Console.
 */
export function robots(ctx) {
    return `User-agent: *\nAllow: /\n\nSitemap: ${ctx.site.url}sitemap.xml\n`;
}

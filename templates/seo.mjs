// Search and link-preview metadata: canonical URL, hreflang alternates, Open Graph,
// Twitter card, JSON-LD, plus sitemap.xml and robots.txt.
import { html, jsonForScript } from "../scripts/lib/html.mjs";
import { OG_SIZE } from "./og-image.mjs";

/** <head> additions for a page that exists in every published language. */
export function homeHead(ctx) {
    const { t, site, locale, locales } = ctx;
    const url = ctx.homeUrl(locale);
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

    return html`<link rel="canonical" href="${url}" />
    ${locales.map((l) => html`<link rel="alternate" hreflang="${l._meta.htmlLang}" href="${ctx.homeUrl(l)}" />
    `)}<link rel="alternate" hreflang="x-default" href="${ctx.homeUrl(locales[0])}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${site.shortName}" />
    <meta property="og:title" content="${t("meta.title")}" />
    <meta property="og:description" content="${t("meta.description")}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="${OG_SIZE.width}" />
    <meta property="og:image:height" content="${OG_SIZE.height}" />
    <meta property="og:image:alt" content="${t("meta.ogImageAlt")}" />
    <meta property="og:locale" content="${locale._meta.ogLocale}" />
    ${locales.filter((l) => l !== locale).map((l) => html`<meta property="og:locale:alternate" content="${l._meta.ogLocale}" />
    `)}<meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">${jsonForScript(person)}</script>`;
}

/** sitemap.xml with every language version of the home page cross-linked. */
export function sitemap(ctx) {
    const alternates = ctx.locales.map(
        (l) => html`    <xhtml:link rel="alternate" hreflang="${l._meta.htmlLang}" href="${ctx.homeUrl(l)}"/>\n`,
    );
    return html`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${ctx.locales.map((l) => html`  <url>
    <loc>${ctx.homeUrl(l)}</loc>
${alternates}    <xhtml:link rel="alternate" hreflang="x-default" href="${ctx.homeUrl(ctx.locales[0])}"/>
  </url>
`)}</urlset>
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

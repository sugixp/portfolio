// Document shell shared by every page: <head>, top bar, footer.
import { html } from "../scripts/lib/html.mjs";
import { translator } from "../scripts/lib/i18n.mjs";

function langSwitch(ctx) {
    return html`<nav class="lang-switch" aria-label="${ctx.t("langSwitch.label")}">
            ${ctx.locales.map((locale, i) => {
                const { lang, htmlLang, label, name } = locale._meta;
                const current = lang === ctx.lang;
                return html`${i > 0 ? html`<span class="lang-sep" aria-hidden="true">/</span>` : ""}<a
              href="${ctx.homePath(locale)}"
              class="${current ? "lang-opt is-active" : "lang-opt"}"
              hreflang="${htmlLang}"
              lang="${htmlLang}"
              aria-label="${label}, ${name}"
              ${current ? html`aria-current="true"` : ""}
              data-lang-link
              >${label}</a
            >`;
            })}
          </nav>`;
}

// One hidden notice per other language, written in that language. js/lang-switch.js
// reveals the one matching the visitor's preference; nobody is redirected.
function langSuggestions(ctx) {
    return ctx.locales
        .filter((locale) => locale !== ctx.locale)
        .map((locale) => {
            const t = translator(locale);
            const { lang, htmlLang } = locale._meta;
            return html`<aside class="lang-suggest" data-suggest-lang="${lang}" lang="${htmlLang}" aria-label="${t("langSwitch.label")}" hidden>
      <div class="wrap lang-suggest-inner">
        <p>${t("langSwitch.suggest")} <a href="${ctx.homePath(locale)}" hreflang="${htmlLang}" data-lang-link>${t("langSwitch.suggestLink")} →</a></p>
        <button type="button" class="lang-suggest-dismiss" data-dismiss>${t("langSwitch.dismiss")}</button>
      </div>
    </aside>`;
        });
}

function topbar(ctx, { navPrefix }) {
    const t = ctx.t;
    const links = [
        ["sobre", "nav.about"],
        ["projetos", "nav.projects"],
        ["stack", "nav.stack"],
        ["trajetoria", "nav.journey"],
        ["contato", "nav.contact"],
    ];
    return html`<header class="topbar">
      <div class="wrap topbar-inner">
        <a href="${navPrefix}#top" class="brand">
          <span class="brand-mark" aria-hidden="true">HS</span>
          <span class="brand-name">sugi<span class="dim">.</span>dev</span>
        </a>
        <nav class="topnav" aria-label="${t("nav.label")}">
          ${links.map(([id, key]) => html`<a href="${navPrefix}#${id}">${t(key)}</a>`)}
        </nav>
        <div class="topbar-actions">
          <span class="status-chip">
            <span class="dot" aria-hidden="true"></span>
            <span class="status-chip-full">${t("statusChip.full")}</span>
            <span class="status-chip-short" aria-hidden="true">${t("statusChip.short")}</span>
          </span>
          ${langSwitch(ctx)}
        </div>
      </div>
    </header>`;
}

/**
 * page: { title, description, head (extra markup), body, navPrefix,
 *         suggestLanguages (offer the other languages when the visitor prefers one) }
 */
export function layout(ctx, page) {
    const { t, base } = ctx;
    return html`<!doctype html>
<html lang="${ctx.locale._meta.htmlLang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${page.title}</title>
    <meta name="description" content="${page.description}" />
    <meta name="theme-color" content="#EEF1F4" />
    <link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="${base}assets/apple-touch-icon.png" />
    ${page.head ?? ""}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="${base}css/style.css" />
    <script type="module" src="${base}js/main.js"></script>
  </head>
  <body id="top">
    <a class="skip-link" href="#conteudo">${t("skipLink")}</a>
    <div class="scanline" aria-hidden="true"></div>

    ${topbar(ctx, page)}
    ${page.suggestLanguages ? langSuggestions(ctx) : ""}

    <main id="conteudo">
${page.body}
    </main>

    <footer class="footer">
      <div class="wrap footer-inner">
        <span>${t("footer.built")}</span>
        <span>© ${ctx.year} ${ctx.site.shortName}</span>
      </div>
    </footer>
  </body>
</html>
`;
}

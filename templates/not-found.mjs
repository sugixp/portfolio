// 404 page. GitHub Pages serves one 404.html for every missing path, whatever
// the language, so it shows every published language and only uses absolute links.
import { html } from "../scripts/lib/html.mjs";
import { translator } from "../scripts/lib/i18n.mjs";

export function notFoundBody(ctx) {
    return html`      <section class="section not-found">
        <div class="wrap not-found-inner">
          <div class="status-panel not-found-panel" aria-hidden="true">
            <div class="status-panel-head">
              <span class="status-panel-title">HTTP/1.1</span>
              <span class="status-pill status-pill-error">
                <span class="dot dot-amber"></span>
                <span>404</span>
              </span>
            </div>
            <dl class="status-list">
              <div class="status-row"><dt>status</dt><dd>not found</dd></div>
              <div class="status-row"><dt>route</dt><dd data-route>—</dd></div>
            </dl>
          </div>
          <div class="not-found-msgs">
            ${ctx.locales.map((locale, i) => {
                const t = translator(locale);
                // One <h1> per page: the default language gets it, the others a styled paragraph.
                const title = i === 0 ? html`<h1>${t("notFound.title")}</h1>` : html`<p class="not-found-title">${t("notFound.title")}</p>`;
                return html`<div class="not-found-msg" lang="${locale._meta.htmlLang}">
              ${title}
              <p>${t("notFound.text")}</p>
              <a class="${i === 0 ? "btn btn-primary" : "btn btn-ghost"}" href="${ctx.homePath(locale)}">${t("notFound.home")}</a>
            </div>`;
            })}
          </div>
        </div>
      </section>`;
}

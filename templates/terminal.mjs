// Command terminal: a closed <dialog> (invisible without JS) and the data the
// commands answer from, serialized into the page so js/terminal.js needs no fetch.
import { html, jsonForScript } from "../scripts/lib/html.mjs";
import { localize } from "../scripts/lib/localize.mjs";
import { sortProjects } from "../scripts/lib/projects.mjs";
import { cvPdfPath } from "./cv.mjs";

function terminalData(ctx, relPath) {
    const { t, lang, site, data } = ctx;
    const strip = (url) => url.replace(/^https:\/\//, "");
    return {
        s: t("terminal"),
        cv: cvPdfPath(ctx),
        whoami: [site.name, t("hero.role"), `${t("panel.rows")[0].value} · ${t("statusChip.full")}`],
        projects: sortProjects(data.projects.projects).map((p) => {
            const caseStudy = ctx.caseStudyPath(p);
            return {
                id: p.id,
                title: p.title,
                status: t(`projects.status.${p.status}`),
                href: caseStudy ?? p.links.demo ?? p.links.repo,
                caseStudy: Boolean(caseStudy),
            };
        }),
        stack: data.stack.groups.map((g) => ({ title: localize(g.title, lang), items: g.items.map((i) => localize(i, lang)) })),
        contact: [
            { label: "email", text: site.email, href: `mailto:${site.email}` },
            { label: "linkedin", text: strip(site.links.linkedin), href: site.links.linkedin },
            { label: "github", text: strip(site.links.github), href: site.links.github },
        ],
        langs: ctx.locales.map((l) => ({
            code: l._meta.lang,
            label: l._meta.name,
            href: ctx.homePath(l) + (relPath ?? ""),
            current: l === ctx.locale,
        })),
    };
}

export function terminalButton(ctx) {
    return html`<button type="button" class="icon-btn" data-terminal-open aria-label="${ctx.t("terminal.open")}" aria-keyshortcuts="Control+K" hidden>
            <span aria-hidden="true">&gt;_</span>
          </button>`;
}

export function terminalDialog(ctx, relPath) {
    const { t } = ctx;
    return html`<dialog class="terminal" aria-labelledby="terminal-title" data-terminal>
      <div class="terminal-bar">
        <span id="terminal-title" class="mono">${t("terminal.title")}</span>
        <button type="button" class="icon-btn" data-terminal-close>${t("terminal.close")}</button>
      </div>
      <div class="terminal-out mono" role="log" aria-live="polite" data-terminal-output>
        <p>${t("terminal.hint")}</p>
      </div>
      <form class="terminal-form" data-terminal-form>
        <span class="terminal-prompt mono" aria-hidden="true">$</span>
        <label for="terminal-input" class="visually-hidden">${t("terminal.inputLabel")}</label>
        <input id="terminal-input" class="mono" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="send" />
      </form>
    </dialog>
    <script type="application/json" id="terminal-data">${jsonForScript(terminalData(ctx, relPath))}</script>`;
}

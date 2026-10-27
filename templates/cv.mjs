// Résumé page (/cv/ in each language), built from the same data as the site and
// printed to PDF by scripts/cv-pdf.mjs. Written for applicant tracking systems:
// one column, standard section names, real text, links spelled out.
import { html } from "../scripts/lib/html.mjs";
import { localize } from "../scripts/lib/localize.mjs";
import { sortProjects } from "../scripts/lib/projects.mjs";

const strip = (url) => url.replace(/^https:\/\//, "").replace(/\/$/, "");

export const CV_DIR = "cv";

/** Where the PDF of a locale is published (written by scripts/cv-pdf.mjs). */
export function cvPdfPath(ctx, locale = ctx.locale) {
    return `${ctx.base}${locale._meta.path}${CV_DIR}/${locale.cv.fileName}`;
}

function entry({ title, meta, body, links }) {
    return html`<li class="cv-entry">
            <p class="cv-entry-head"><strong>${title}</strong>${meta ? html`<span class="cv-entry-meta">${meta}</span>` : ""}</p>
            ${body ? html`<p>${body}</p>` : ""}
            ${links?.length ? html`<p class="cv-links">${links.map((l, i) => html`${i ? " | " : ""}<a href="${l}">${strip(l)}</a>`)}</p>` : ""}
          </li>`;
}

function section(title, content) {
    return html`<section class="cv-section">
          <h2>${title}</h2>
          ${content}
        </section>`;
}

export function cvArticle(ctx) {
    const { t, lang, site, data } = ctx;
    const range = (e) => `${e.start}–${e.end ?? t("experience.present")}`;
    const timeline = data.experience.experience;
    const education = timeline.filter((e) => e.kind === "education");
    const work = timeline.filter((e) => e.kind !== "education");
    const languages = t("panel.rows")[2].value;

    return html`<article class="cv" aria-labelledby="cv-name">
        <header class="cv-head">
          <h1 id="cv-name">${site.name}</h1>
          <p class="cv-role">${t("hero.role")}</p>
          <p class="cv-contact">
            ${t("cv.location")} | <a href="mailto:${site.email}">${site.email}</a> |
            <a href="${site.links.linkedin}">${strip(site.links.linkedin)}</a> |
            <a href="${site.links.github}">${strip(site.links.github)}</a> |
            <a href="${ctx.homeUrl(ctx.locale)}">${strip(ctx.homeUrl(ctx.locale))}</a>
          </p>
        </header>

        ${section(t("cv.summary"), html`<p>${t("hero.desc")}</p>
          <p>${t("cv.availability")}</p>`)}

        ${section(
            t("cv.projects"),
            html`<ul class="cv-list">
          ${sortProjects(data.projects.projects).map((p) =>
              entry({
                  title: p.title,
                  meta: p.tech.join(", "),
                  body: localize(p.description, lang),
                  links: [p.links.demo, p.links.repo].filter(Boolean),
              }),
          )}
        </ul>`,
        )}

        ${education.length
            ? section(
                  t("cv.education"),
                  html`<ul class="cv-list">
          ${education.map((e) => entry({ title: localize(e.title, lang), meta: range(e), body: localize(e.description, lang) }))}
        </ul>`,
              )
            : ""}

        ${section(
            t("cv.experience"),
            html`<ul class="cv-list">
          ${work.map((e) => entry({ title: localize(e.title, lang), meta: range(e), body: localize(e.description, lang) }))}
        </ul>`,
        )}

        ${section(
            t("cv.skills"),
            html`<ul class="cv-plain">
          ${data.stack.groups.map(
              (g) => html`<li><strong>${localize(g.title, lang)}:</strong> ${g.items.map((i) => localize(i, lang)).join(", ")}</li>`,
          )}
        </ul>`,
        )}

        ${section(
            t("cv.certifications"),
            html`<ul class="cv-plain">
          ${data.certifications.certifications.map(
              (c) => html`<li>${localize(c.name, lang)} — ${localize(c.meta, lang)}</li>`,
          )}
        </ul>`,
        )}

        ${section(t("cv.languages"), html`<p>${languages}</p>`)}
      </article>`;
}

export function cvBody(ctx) {
    const { t } = ctx;
    return html`      <div class="cv-page">
        <div class="cv-toolbar wrap">
          <p class="cv-note">${t("cv.print")}</p>
          <a class="btn btn-primary" href="${cvPdfPath(ctx)}" download>${t("cv.downloadPdf")}</a>
        </div>
        <div class="cv-sheet">
      ${cvArticle(ctx)}
        </div>
      </div>`;
}

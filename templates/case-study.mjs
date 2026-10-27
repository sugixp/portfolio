// Case-study page (/projects/<id>/ and /en/projects/<id>/). A real page, so it
// works without JS, can be shared and indexed; js/case-study.js opens the same
// <article> in a dialog when the link is clicked on the home page.
import { html } from "../scripts/lib/html.mjs";
import { localize } from "../scripts/lib/localize.mjs";
import { statusLamp } from "./parts.mjs";

function list(items, lang) {
    return html`<ul class="cs-list">
              ${items.map((item) => html`<li>${localize(item, lang)}</li>`)}
            </ul>`;
}

export function caseStudyArticle(ctx, project) {
    const { t, lang } = ctx;
    const cs = project.caseStudy;
    const external = (href, label) => html`<a href="${href}" target="_blank" rel="noopener">${label}<span class="visually-hidden"> — ${project.title}</span></a>`;
    return html`<article class="case-study" aria-labelledby="cs-title-${project.id}">
          ${cs.draft ? html`<p class="cs-draft mono" role="note">${t("caseStudy.draft")}</p>` : ""}
          <header class="cs-head">
            <p class="station-status mono">${statusLamp(project.status, t(`projects.status.${project.status}`))}<span>${t("caseStudy.label")}</span></p>
            <h1 id="cs-title-${project.id}">${project.title}</h1>
            <p class="cs-summary">${localize(project.description, lang)}</p>
            <ul class="tags">${project.tech.map((tech) => html`<li>${tech}</li>`)}</ul>
            <p class="station-links">
              ${project.links.repo ? external(project.links.repo, t("projects.repo")) : ""}
              ${project.links.demo ? external(project.links.demo, t("projects.demo")) : ""}
            </p>
          </header>

          <section class="cs-section" aria-labelledby="cs-problem-${project.id}">
            <h2 id="cs-problem-${project.id}">${t("caseStudy.problem")}</h2>
            <p>${localize(cs.problem, lang)}</p>
          </section>

          <section class="cs-section" aria-labelledby="cs-arch-${project.id}">
            <h2 id="cs-arch-${project.id}">${t("caseStudy.architecture")}</h2>
            <ol class="flow" aria-label="${t("caseStudy.architectureLabel")}">
              ${cs.architecture.steps.map(
                  (step) => html`<li class="flow-step">
                <span class="flow-label">${localize(step.label, lang)}</span>
                ${step.detail ? html`<span class="flow-detail mono">${localize(step.detail, lang)}</span>` : ""}
              </li>`,
              )}
            </ol>
          </section>

          <section class="cs-section" aria-labelledby="cs-decisions-${project.id}">
            <h2 id="cs-decisions-${project.id}">${t("caseStudy.decisions")}</h2>
            ${list(cs.decisions, lang)}
          </section>

          <section class="cs-section" aria-labelledby="cs-challenges-${project.id}">
            <h2 id="cs-challenges-${project.id}">${t("caseStudy.challenges")}</h2>
            ${list(cs.challenges, lang)}
          </section>

          <section class="cs-section" aria-labelledby="cs-learned-${project.id}">
            <h2 id="cs-learned-${project.id}">${t("caseStudy.learned")}</h2>
            ${list(cs.learned, lang)}
          </section>
        </article>`;
}

export function caseStudyBody(ctx, project) {
    return html`      <div class="wrap cs-page">
        <p class="cs-back"><a href="${ctx.homePath(ctx.locale)}#projetos">← ${ctx.t("caseStudy.back")}</a></p>
        ${caseStudyArticle(ctx, project)}
      </div>`;
}

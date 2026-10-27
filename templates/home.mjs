// Home page: every section rendered from data/*.json and i18n/<lang>.json.
import { html } from "../scripts/lib/html.mjs";
import { plural } from "../scripts/lib/i18n.mjs";
import { localize } from "../scripts/lib/localize.mjs";
import { collectTechs, sortProjects } from "../scripts/lib/projects.mjs";
import { dateRange, lamp, projectPreview, statusLamp } from "./parts.mjs";
import { cvPdfPath } from "./cv.mjs";

function external(href, content, attrs = "") {
    return html`<a href="${href}" target="_blank" rel="noopener" ${attrs}>${content}</a>`;
}

function sectionHead(t, key, aside = "") {
    return html`<div class="sec-head">
            <h2>${t(`${key}.title`)}</h2>
            ${aside ? html`<span class="sec-aside mono">${aside}</span>` : ""}
          </div>`;
}

// Status board: the profile rows from i18n plus, when data/github.json exists,
// live cells from it (ctx.board). span = columns out of 6.
function boardCells({ t, board }) {
    const rows = t("panel.rows");
    const cells = [
        { ...rows[0], span: 2 },
        { ...rows[1], span: 2 },
        { ...rows[2], span: 2 },
        { ...rows[3], span: 3 },
        { ...rows[4], span: 3, lamp: "warn" },
    ];
    return [...cells, ...(board ?? [])];
}

function hero(ctx) {
    const { t, site } = ctx;
    return html`      <section class="hero">
        <div class="wrap">
          <h1 class="hero-name">${site.name}</h1>
          <div class="hero-sub">
            <p class="hero-desc"><strong>${t("hero.role")}</strong> ${t("hero.desc")}</p>
            <div class="hero-actions">
              <a href="#projetos" class="btn btn-primary">${t("hero.ctaProjects")}</a>
              <a href="${cvPdfPath(ctx)}" class="btn" download>${t("cv.download")}<span class="visually-hidden"> (PDF)</span></a>
            </div>
          </div>

          <div class="board" role="group" aria-label="${t("panel.label")}">
            ${boardCells(ctx).map(
                (cell) => html`<div class="board-cell spot" data-span="${cell.span}">
              <p class="board-label mono">${cell.label}${cell.lamp ? lamp(cell.lamp, cell.state) : ""}</p>
              <p class="board-value">${cell.value}</p>
              ${cell.detail ? html`<p class="board-detail mono">${cell.detail}</p>` : ""}
            </div>`,
            )}
            <div class="board-foot mono"><span>${t("panel.foot")}</span><span>${t("panel.footRight")}</span></div>
          </div>
        </div>
      </section>`;
}

function about({ t }) {
    return html`      <section id="sobre" class="section">
        <div class="wrap about">
          <h2>${t("about.title")}</h2>
          <p class="section-lead">${t("about.lead")}</p>
        </div>
      </section>`;
}

function projectCard(ctx, project) {
    const { t, lang } = ctx;
    const preview = projectPreview(ctx, project);
    const caseStudy = ctx.caseStudyPath(project);
    const hidden = html`<span class="visually-hidden"> — ${project.title}</span>`;
    return html`<article
              class="${["station", "spot", "reveal", project.featured && "station-featured", !preview && "station-plain"].filter(Boolean).join(" ")}"
              data-tech="${JSON.stringify(project.tech)}"
            >
              ${preview ? html`<div class="station-shot">${preview}</div>` : ""}
              <div class="station-body">
                <p class="station-status mono">${statusLamp(project.status, t(`projects.status.${project.status}`))}${project.featured ? html`<span class="badge">${t("projects.featured")}</span>` : ""}</p>
                <h3>${project.title}</h3>
                <p>${localize(project.description, lang)}</p>
                <ul class="tags">
                  ${project.tech.map((tech) => html`<li>${tech}</li>`)}
                </ul>
                <div class="station-links">
                  ${caseStudy ? html`<a href="${caseStudy}" data-case-study>${t("projects.caseStudy")}${hidden}</a>` : ""}
                  ${project.links.repo ? external(project.links.repo, html`${t("projects.repo")}${hidden}`) : ""}
                  ${project.links.demo ? external(project.links.demo, html`${t("projects.demo")}${hidden}`) : ""}
                </div>
              </div>
            </article>`;
}

function projects(ctx) {
    const { t, data } = ctx;
    const list = sortProjects(data.projects.projects);
    const count = t("projects.count");
    // The filter needs JS to work, so it ships hidden and js/project-filter.js reveals it.
    return html`      <section id="projetos" class="section">
        <div class="wrap">
          ${sectionHead(t, "projects")}
          <div class="projects-root" data-project-filter>
            <div class="filter-bar">
              <div class="filter" role="group" aria-label="${t("projects.filterLabel")}" hidden>
                <button type="button" class="filter-btn" data-tech="" aria-pressed="true">${t("projects.filterAll")}</button>
                ${collectTechs(list).map(
                    (tech) => html`<button type="button" class="filter-btn" data-tech="${tech}" aria-pressed="false">${tech}</button>`,
                )}
              </div>
              <p class="filter-count mono" aria-live="polite" data-one="${count.one}" data-other="${count.other}">${plural(count, list.length)}</p>
            </div>
            <div class="stations" data-case-labels data-close="${t("caseStudy.close")}" data-page="${t("caseStudy.openPage")}">
            ${list.map((project) => projectCard(ctx, project))}
            </div>
          </div>
        </div>
      </section>`;
}

function stack({ t, lang, data }) {
    return html`      <section id="stack" class="section">
        <div class="wrap">
          ${sectionHead(t, "stack")}
          <div class="stack">
            ${data.stack.groups.map(
                (group) => html`<div class="${group.planned ? "stack-group stack-group-planned spot reveal" : "stack-group spot reveal"}">
              <h3>${localize(group.title, lang)}</h3>
              <ul>
                ${group.items.map((item) => html`<li>${localize(item, lang)}</li>`)}
              </ul>
            </div>`,
            )}
          </div>
        </div>
      </section>`;
}

function certifications({ t, lang, data }) {
    return html`      <section id="certificacoes" class="section">
        <div class="wrap">
          ${sectionHead(t, "certifications")}
          <ul class="certs">
            ${data.certifications.certifications.map((cert) => {
                const name = localize(cert.name, lang);
                return html`<li class="cert reveal">
              <p class="cert-name">${cert.url ? external(cert.url, name) : name}</p>
              <p class="cert-meta mono">${localize(cert.meta, lang)}</p>
            </li>`;
            })}
          </ul>
        </div>
      </section>`;
}

function experience({ t, lang, data }) {
    // Most recent first (the order of experience.json): left to right on wide
    // screens, top to bottom on phones.
    const items = data.experience.experience;
    return html`      <section id="trajetoria" class="section">
        <div class="wrap">
          ${sectionHead(t, "experience")}
          <ol class="timeline">
            ${items.map(
                (item) => html`<li class="timeline-item reveal">
              <p class="timeline-date mono">${dateRange(t, item)}</p>
              <h3>${localize(item.title, lang)}</h3>
              <p>${localize(item.description, lang)}</p>
            </li>`,
            )}
          </ol>
        </div>
      </section>`;
}

function contact({ t, site }) {
    return html`      <section id="contato" class="section">
        <div class="wrap">
          <div class="contact spot">
            <div>
              <h2>${t("contact.title")}</h2>
              <p class="section-lead">${t("contact.lead")}</p>
            </div>
            <div class="contact-links">
              <a href="mailto:${site.email}" class="contact-email">${site.email}</a>
              <p class="contact-social">
                ${external(site.links.linkedin, "LinkedIn")}
                ${external(site.links.github, "GitHub")}
              </p>
            </div>
          </div>
        </div>
      </section>`;
}

export function homeBody(ctx) {
    return html`${hero(ctx)}

${about(ctx)}

${projects(ctx)}

${stack(ctx)}

${certifications(ctx)}

${experience(ctx)}

${contact(ctx)}`;
}

// Home page: every section rendered from data/*.json and i18n/<lang>.json.
import { html } from "../scripts/lib/html.mjs";
import { plural } from "../scripts/lib/i18n.mjs";
import { localize } from "../scripts/lib/localize.mjs";
import { collectTechs, sortProjects } from "../scripts/lib/projects.mjs";

function external(href, content, attrs = "") {
    return html`<a href="${href}" target="_blank" rel="noopener" ${attrs}>${content}</a>`;
}

function sectionHead(t, key) {
    return html`<p class="eyebrow">${t(`${key}.eyebrow`)}</p>
          <h2>${t(`${key}.title`)}</h2>`;
}

function hero({ t, site }) {
    return html`      <section class="hero">
        <div class="wrap hero-inner">
          <div class="hero-text">
            <p class="eyebrow">${t("hero.eyebrow")}</p>
            <h1>${site.name}</h1>
            <p class="hero-role">${t("hero.role")}</p>
            <p class="hero-desc">${t("hero.desc")}</p>
            <div class="hero-actions">
              <a href="#projetos" class="btn btn-primary">${t("hero.ctaProjects")}</a>
              <a href="#contato" class="btn btn-ghost">${t("hero.ctaContact")}</a>
            </div>
          </div>

          <div class="status-panel" role="group" aria-label="${t("panel.label")}">
            <div class="status-panel-head">
              <span class="status-panel-title">${t("panel.title")}</span>
              <span class="status-pill">
                <span class="dot" aria-hidden="true"></span>
                <span>${t("panel.online")}</span>
              </span>
            </div>
            <dl class="status-list">
              ${t("panel.rows").map(
                  (row) => html`<div class="status-row">
                <dt>${row.label}</dt>
                <dd>${row.value}</dd>
              </div>`,
              )}
            </dl>
          </div>
        </div>
      </section>`;
}

function about({ t }) {
    return html`      <section id="sobre" class="section">
        <div class="wrap">
          ${sectionHead(t, "about")}
          <p class="section-lead">${t("about.lead")}</p>
        </div>
      </section>`;
}

const STATUS_DOT = { stable: "dot dot-muted", archived: "dot dot-muted", "in-progress": "dot dot-amber" };

function projectLink(href, label, title) {
    return external(
        href,
        html`${label}<span class="visually-hidden"> — ${title}</span><span aria-hidden="true"> →</span>`,
    );
}

function projectCard({ t, lang }, project) {
    return html`<article
              class="${project.featured ? "project-card project-card-featured" : "project-card"}"
              data-tech="${JSON.stringify(project.tech)}"
            >
              <div class="project-top">
                ${project.featured ? html`<span class="project-badge">${t("projects.featured")}</span>` : ""}
                <span class="project-status"
                  ><span class="${STATUS_DOT[project.status] ?? "dot"}" aria-hidden="true"></span
                  ><span>${t(`projects.status.${project.status}`)}</span></span
                >
              </div>
              <h3>${project.title}</h3>
              <p>${localize(project.description, lang)}</p>
              <ul class="tag-list">
                ${project.tech.map((tech) => html`<li>${tech}</li>`)}
              </ul>
              <div class="project-links">
                ${project.links.repo ? projectLink(project.links.repo, t("projects.repo"), project.title) : ""}
                ${project.links.demo ? projectLink(project.links.demo, t("projects.demo"), project.title) : ""}
              </div>
            </article>`;
}

function projects(ctx) {
    const { t, data } = ctx;
    const list = sortProjects(data.projects.projects);
    const count = t("projects.count");
    // The filter needs JS to work, so it ships hidden and js/project-filter.js reveals it.
    return html`      <section id="projetos" class="section section-alt">
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
              <p class="filter-count" aria-live="polite" data-one="${count.one}" data-other="${count.other}">${plural(count, list.length)}</p>
            </div>
            <div class="projects-grid">
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
          <div class="stack-grid">
            ${data.stack.groups.map(
                (group) => html`<div class="stack-group">
              <h3>${localize(group.title, lang)}</h3>
              <ul class="${group.planned ? "tag-list tag-list-mono tag-list-planned" : "tag-list tag-list-mono"}">
                ${group.items.map((item) => html`<li>${item}</li>`)}
              </ul>
            </div>`,
            )}
          </div>
        </div>
      </section>`;
}

function certifications({ t, lang, data }) {
    return html`      <section id="certificacoes" class="section section-alt">
        <div class="wrap">
          ${sectionHead(t, "certifications")}
          <div class="cert-grid">
            ${data.certifications.certifications.map((cert) => {
                const name = localize(cert.name, lang);
                return html`<div class="cert-item">
              <span class="cert-check" aria-hidden="true">✓</span>
              <div>
                <p class="cert-name">${cert.url ? external(cert.url, name) : name}</p>
                <p class="cert-meta">${localize(cert.meta, lang)}</p>
              </div>
            </div>`;
            })}
          </div>
        </div>
      </section>`;
}

function experience({ t, lang, data }) {
    return html`      <section id="trajetoria" class="section">
        <div class="wrap">
          ${sectionHead(t, "experience")}
          <ol class="timeline">
            ${data.experience.experience.map(
                (item) => html`<li class="timeline-item">
              <div class="timeline-marker" aria-hidden="true"></div>
              <div class="timeline-content">
                <p class="timeline-date">${item.start} — ${item.end ?? t("experience.present")}</p>
                <h3>${localize(item.title, lang)}</h3>
                <p>${localize(item.description, lang)}</p>
              </div>
            </li>`,
            )}
          </ol>
        </div>
      </section>`;
}

function contact({ t, site }) {
    return html`      <section id="contato" class="section section-contact">
        <div class="wrap">
          ${sectionHead(t, "contact")}
          <p class="section-lead">${t("contact.lead")}</p>
          <div class="contact-links">
            <a href="mailto:${site.email}" class="btn btn-primary">${site.email}</a>
            ${external(site.links.linkedin, "LinkedIn →", html`class="btn btn-ghost"`)}
            ${external(site.links.github, "GitHub →", html`class="btn btn-ghost"`)}
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

// Standalone 1200×630 page that scripts/og-image.mjs screenshots into the
// Open Graph image (the preview card shown by LinkedIn, Slack, WhatsApp...).
import { html } from "../scripts/lib/html.mjs";

export const OG_SIZE = { width: 1200, height: 630 };

export function ogImagePage({ t, site }) {
    const host = site.url.replace(/^https:\/\//, "").replace(/\/$/, "");
    return html`<!doctype html>
<html lang="${t("_meta.htmlLang")}">
  <head>
    <meta charset="UTF-8" />
    <link
      href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=IBM+Plex+Sans:wght@400&display=block"
      rel="stylesheet"
    />
    <style>
      * { box-sizing: border-box; margin: 0; }
      body {
        width: ${OG_SIZE.width}px;
        height: ${OG_SIZE.height}px;
        background: #EEF1F4;
        color: #10192B;
        font-family: "IBM Plex Sans", sans-serif;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 48px;
        align-items: center;
        padding: 0 72px;
        border-top: 10px solid #0F8C82;
      }
      .eyebrow, h1, .role, .url, .panel { font-family: "JetBrains Mono", monospace; }
      .eyebrow { color: #0B6A62; font-size: 24px; margin-bottom: 18px; }
      h1 { font-size: 60px; line-height: 1.08; letter-spacing: -0.01em; margin-bottom: 22px; }
      .role { color: #0B6A62; font-size: 27px; font-weight: 700; margin-bottom: 40px; }
      .url { color: #5B6472; font-size: 22px; }
      .panel {
        background: #10192B;
        color: #fff;
        border-radius: 16px;
        padding: 30px 30px 22px;
        box-shadow: 0 30px 60px -30px rgba(16, 25, 43, 0.55);
      }
      .head {
        display: flex;
        justify-content: space-between;
        padding-bottom: 18px;
        margin-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.14);
        font-size: 17px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: rgba(255, 255, 255, 0.55);
      }
      .online { color: #7FE8DA; text-transform: none; }
      .online::before { content: "● "; }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        padding: 13px 0;
        border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
        font-size: 17px;
      }
      .row:last-child { border-bottom: none; }
      .row span:first-child { color: rgba(255, 255, 255, 0.5); white-space: nowrap; }
      .row span:last-child { text-align: right; }
    </style>
  </head>
  <body>
    <div>
      <p class="eyebrow">${t("hero.eyebrow")}</p>
      <h1>${site.name}</h1>
      <p class="role">${t("hero.role")}</p>
      <p class="url">${host}</p>
    </div>
    <div class="panel">
      <div class="head"><span>${t("panel.title")}</span><span class="online">${t("panel.online")}</span></div>
      ${t("panel.rows").map((row) => html`<div class="row"><span>${row.label}</span><span>${row.value}</span></div>`)}
    </div>
  </body>
</html>
`;
}

// Standalone 1200×630 page that scripts/og-image.mjs screenshots into the
// Open Graph image (the preview card shown by LinkedIn, Slack, WhatsApp...).
import { html } from "../scripts/lib/html.mjs";
import { FONTS_URL } from "./layout.mjs";

export const OG_SIZE = { width: 1200, height: 630 };

export function ogImagePage({ t, site }) {
    const host = site.url.replace(/^https:\/\//, "").replace(/\/$/, "");
    const rows = t("panel.rows");
    return html`<!doctype html>
<html lang="${t("_meta.htmlLang")}">
  <head>
    <meta charset="UTF-8" />
    <link href="${FONTS_URL.replace("display=swap", "display=block")}" rel="stylesheet" />
    <style>
      * { box-sizing: border-box; margin: 0; }
      body {
        width: ${OG_SIZE.width}px;
        height: ${OG_SIZE.height}px;
        background: #15171A;
        color: #ECEAE4;
        font-family: "Archivo", sans-serif;
        padding: 64px 72px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .mono { font-family: "Martian Mono", monospace; font-stretch: 87.5%; }
      h1 { font-size: 78px; font-weight: 800; font-stretch: 125%; line-height: 0.95; letter-spacing: -0.02em; }
      .role { margin-top: 22px; font-size: 30px; font-weight: 600; font-stretch: 112%; color: #A9A79F; }
      .board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #2E3339; border: 1px solid #2E3339; border-radius: 10px; overflow: hidden; }
      .cell { background: #1C1F23; padding: 20px 22px; display: grid; gap: 10px; }
      .label { display: flex; justify-content: space-between; font-size: 15px; color: #8A8982; }
      .value { font-size: 21px; font-weight: 600; font-stretch: 112%; }
      .state { display: inline-flex; align-items: center; gap: 8px; color: #E3A21A; }
      .lamp { width: 10px; height: 10px; border-radius: 50%; background: #E3A21A; box-shadow: 0 0 14px rgba(227, 162, 26, 0.6); }
      .foot { display: flex; justify-content: space-between; font-size: 16px; color: #8A8982; }
    </style>
  </head>
  <body>
    <div>
      <h1>${site.name}</h1>
      <p class="role">${t("hero.role")}</p>
    </div>
    <div class="board">
      <div class="cell"><p class="label mono">${rows[1].label}</p><p class="value">${rows[1].value}</p></div>
      <div class="cell"><p class="label mono">${rows[2].label}</p><p class="value">${rows[2].value}</p></div>
      <div class="cell"><p class="label mono">${rows[4].label}<span class="state"><span class="lamp"></span>${rows[4].state}</span></p><p class="value">${rows[4].value}</p></div>
    </div>
    <p class="foot mono"><span>${t("panel.footRight")}</span><span>${host}</span></p>
  </body>
</html>
`;
}

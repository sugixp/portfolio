// Progressive enhancement only: all content is already in the HTML generated
// by scripts/build.mjs. If this file fails to load, the page stays complete.
import { initProjectFilter } from "./project-filter.js";
import { initLangSwitch } from "./lang-switch.js";
import { initTheme } from "./theme.js";
import { initCaseStudies } from "./case-study.js";
import { initTerminal } from "./terminal.js";
import { initSpotlight } from "./spotlight.js";

initProjectFilter(document.querySelector("[data-project-filter]"));
initLangSwitch();
initTheme();
initCaseStudies();
initTerminal();
initSpotlight();

// 404 page: show which address was requested (textContent, never markup).
const route = document.querySelector("[data-route]");
if (route) route.textContent = location.pathname;

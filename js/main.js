// Progressive enhancement only: all content is already in the HTML generated
// by scripts/build.mjs. If this file fails to load, the page stays complete.
import { initProjectFilter } from "./project-filter.js";
import { initLangSwitch } from "./lang-switch.js";

initProjectFilter(document.querySelector("[data-project-filter]"));
initLangSwitch();

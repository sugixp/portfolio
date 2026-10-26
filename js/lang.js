// Current language state. Static markup is translated through data-pt/data-en
// attributes; rendered sections subscribe with onLangChange and re-render.
import { DEFAULT_LANG, normalizeLang } from "./lib/localize.js";

const STORAGE_KEY = "portfolio-lang";
const root = document.documentElement;
const listeners = new Set();
let current = DEFAULT_LANG;

export function getLang() {
    return current;
}

export function onLangChange(listener) {
    listeners.add(listener);
}

export function setLang(lang) {
    current = normalizeLang(lang) ?? DEFAULT_LANG;
    root.setAttribute("data-lang", current);
    root.setAttribute("lang", current === "pt" ? "pt-BR" : "en");

    document.querySelectorAll("[data-pt][data-en]").forEach((el) => {
        el.textContent = el.getAttribute(`data-${current}`);
    });

    document.querySelectorAll("#lang-toggle [data-code]").forEach((opt) => {
        opt.classList.toggle("is-active", opt.dataset.code === current);
    });

    try {
        localStorage.setItem(STORAGE_KEY, current);
    } catch {
        /* localStorage indisponível — segue sem persistir preferência */
    }

    listeners.forEach((listener) => listener(current));
}

export function initLang() {
    let saved = null;
    try {
        saved = localStorage.getItem(STORAGE_KEY);
    } catch {
        /* segue com padrão pt */
    }
    setLang(saved ?? DEFAULT_LANG);

    document.getElementById("lang-toggle")?.addEventListener("click", () => {
        setLang(current === "pt" ? "en" : "pt");
    });
}

// Dark is the default; light is an opt-in that is remembered. The saved choice
// is applied by a tiny inline script in <head> before first paint (no flash);
// this module only wires the button, which ships hidden because it needs JS.
export const THEME_KEY = "portfolio-theme";
const THEME_COLORS = { dark: "#15171A", light: "#EDEFF1" };

const root = document.documentElement;

export function currentTheme() {
    return root.dataset.theme === "light" ? "light" : "dark";
}

function apply(theme, button) {
    if (theme === "light") root.dataset.theme = "light";
    else delete root.dataset.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
    // The label names the action the button will perform next.
    button.setAttribute("aria-label", button.dataset[theme === "light" ? "labelDark" : "labelLight"]);
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch {
        /* localStorage indisponível — vale só nesta visita */
    }
}

export function setTheme(theme, button = document.querySelector("[data-theme-toggle]")) {
    if (!button) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (document.startViewTransition && !reduced) document.startViewTransition(() => apply(theme, button));
    else apply(theme, button);
}

export function initTheme() {
    const button = document.querySelector("[data-theme-toggle]");
    if (!button) return;
    button.setAttribute("aria-label", button.dataset[currentTheme() === "light" ? "labelDark" : "labelLight"]);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[currentTheme()]);
    button.addEventListener("click", () => setTheme(currentTheme() === "light" ? "dark" : "light", button));
    button.hidden = false;
}

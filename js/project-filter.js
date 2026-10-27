// Technology filter over the pre-rendered project cards. The selection is kept
// in the URL (?tech=Python) so a filtered view can be shared.
const PARAM = "tech";

export function initProjectFilter(root) {
    if (!root) return;
    const group = root.querySelector(".filter");
    const buttons = [...group.querySelectorAll("button[data-tech]")];
    const cards = [...root.querySelectorAll("[data-tech]:not(button)")].map((el) => ({
        el,
        techs: JSON.parse(el.dataset.tech),
    }));
    const count = root.querySelector(".filter-count");
    const techs = buttons.map((b) => b.dataset.tech).filter(Boolean);

    function select(tech, { updateURL = true } = {}) {
        let visible = 0;
        for (const card of cards) {
            const show = !tech || card.techs.includes(tech);
            card.el.hidden = !show;
            if (show) visible++;
        }
        for (const btn of buttons) btn.setAttribute("aria-pressed", String((btn.dataset.tech || null) === tech));
        count.textContent = (visible === 1 ? count.dataset.one : count.dataset.other).replace("{n}", visible);

        if (updateURL) {
            const url = new URL(location.href);
            if (tech) url.searchParams.set(PARAM, tech);
            else url.searchParams.delete(PARAM);
            history.replaceState(history.state, "", url);
        }
    }

    for (const btn of buttons) btn.addEventListener("click", () => select(btn.dataset.tech || null));

    const fromURL = new URLSearchParams(location.search).get(PARAM);
    select(techs.includes(fromURL) ? fromURL : null, { updateURL: false });
    group.hidden = false;
}

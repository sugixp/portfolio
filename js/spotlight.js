// Soft highlight that follows the pointer over cards (.spot). Purely decorative:
// only for precise pointers, never with reduced motion, and one delegated
// listener throttled to animation frames instead of one per card.
export function initSpotlight() {
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let last = null;
    document.addEventListener("pointermove", (event) => {
        last = event;
        if (frame) return;
        frame = requestAnimationFrame(() => {
            frame = 0;
            const card = last.target instanceof Element ? last.target.closest(".spot") : null;
            if (!card) return;
            const rect = card.getBoundingClientRect();
            card.style.setProperty("--mx", `${last.clientX - rect.left}px`);
            card.style.setProperty("--my", `${last.clientY - rect.top}px`);
        });
    }, { passive: true });
}

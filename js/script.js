(function () {
    const root = document.documentElement;
    const toggleBtn = document.getElementById("lang-toggle");
    const optPt = toggleBtn.querySelector('[data-code="pt"]');
    const optEn = toggleBtn.querySelector('[data-code="en"]');

    function applyLang(lang) {
        root.setAttribute("data-lang", lang);
        root.setAttribute("lang", lang === "pt" ? "pt-BR" : "en");

        document.querySelectorAll("[data-pt][data-en]").forEach((el) => {
            const text = lang === "pt" ? el.getAttribute("data-pt") : el.getAttribute("data-en");
            if (text !== null) el.textContent = text;
        });

        optPt.classList.toggle("is-active", lang === "pt");
        optEn.classList.toggle("is-active", lang === "en");

        try {
            localStorage.setItem("portfolio-lang", lang);
        } catch (e) {
            /* localStorage indisponível — segue sem persistir preferência */
        }
    }

    toggleBtn.addEventListener("click", () => {
        const atual = root.getAttribute("data-lang");
        applyLang(atual === "pt" ? "en" : "pt");
    });

    let preferido = "pt";
    try {
        preferido = localStorage.getItem("portfolio-lang") || "pt";
    } catch (e) {
        /* segue com padrão pt */
    }
    applyLang(preferido);
})();
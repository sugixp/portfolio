// Case studies are real pages (/projects/<id>/). On the home page this opens the
// same <article> in a native <dialog> instead of navigating: the URL still
// changes, so it can be shared, reloaded (the full page loads) and closed with
// the browser's back button. If anything fails, the link simply navigates.
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function withTransition(update) {
    if (document.startViewTransition && !reduceMotion()) document.startViewTransition(update);
    else update();
}

export function initCaseStudies() {
    const links = [...document.querySelectorAll("a[data-case-study]")];
    if (!links.length || typeof HTMLDialogElement !== "function") return;
    const labels = document.querySelector("[data-case-labels]")?.dataset ?? {};

    const dialog = document.createElement("dialog");
    dialog.className = "case-dialog";
    const bar = document.createElement("div");
    bar.className = "case-dialog-bar";
    const permalink = document.createElement("a");
    permalink.textContent = labels.page ?? "";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "icon-btn";
    close.textContent = labels.close ?? "×";
    close.autofocus = true;
    close.addEventListener("click", () => dialog.close());
    bar.append(permalink, close);
    const body = document.createElement("div");
    body.className = "case-dialog-body";
    dialog.append(bar, body);
    document.body.append(dialog);

    let pushed = false;
    let opener = null;

    async function open(href, { push = true } = {}) {
        let article;
        try {
            const res = await fetch(href);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const doc = new DOMParser().parseFromString(await res.text(), "text/html");
            article = doc.querySelector("article.case-study");
            if (!article) throw new Error("no article");
        } catch {
            location.assign(href);
            return;
        }
        body.replaceChildren(document.importNode(article, true));
        dialog.setAttribute("aria-labelledby", article.getAttribute("aria-labelledby"));
        permalink.href = href;
        withTransition(() => {
            dialog.showModal();
            dialog.scrollTop = 0;
        });
        if (push) {
            history.pushState({ caseStudy: href }, "", href);
            pushed = true;
        }
    }

    for (const link of links) {
        link.addEventListener("click", (event) => {
            // Let modified clicks (new tab, etc.) behave like normal links.
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            opener = link;
            open(link.href);
        });
    }

    // Clicking the backdrop closes, like Esc.
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener("close", () => {
        if (pushed) {
            pushed = false;
            history.back();
        }
        opener?.focus();
    });

    window.addEventListener("popstate", (event) => {
        if (dialog.open) {
            pushed = false;
            dialog.close();
        } else if (event.state?.caseStudy) {
            open(event.state.caseStudy, { push: false });
        }
    });
}

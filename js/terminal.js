// Terminal UI. Opens with Ctrl/Cmd+K, the backtick key (when not typing in a
// field) or the >_ button; it never gets in the way of reading the page.
// All output is built with textContent and elements, never innerHTML.
import { complete, createHistory, run } from "./terminal-core.js";
import { currentTheme, setTheme } from "./theme.js";

function isTyping(target) {
    return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

export function initTerminal() {
    const dialog = document.querySelector("[data-terminal]");
    const dataEl = document.getElementById("terminal-data");
    const button = document.querySelector("[data-terminal-open]");
    if (!dialog || !dataEl || typeof HTMLDialogElement !== "function") return;

    const data = JSON.parse(dataEl.textContent);
    const output = dialog.querySelector("[data-terminal-output]");
    const form = dialog.querySelector("[data-terminal-form]");
    const input = dialog.querySelector("input");
    const history = createHistory();

    function print(parts, className) {
        const p = document.createElement("p");
        if (className) p.className = className;
        for (const part of parts) {
            if (typeof part === "string") p.append(part);
            else {
                const a = document.createElement("a");
                a.href = part.href;
                a.textContent = part.text;
                if (/^https?:/.test(part.href)) {
                    a.target = "_blank";
                    a.rel = "noopener";
                }
                p.append(a);
            }
        }
        output.append(p);
    }

    function open() {
        if (dialog.open) return;
        dialog.showModal();
        input.focus();
    }

    function perform(action) {
        if (!action) return;
        if (action.type === "clear") output.replaceChildren();
        if (action.type === "download") {
            const a = document.createElement("a");
            a.href = action.href;
            a.download = "";
            a.click();
        }
        if (action.type === "theme") setTheme(action.value);
        if (action.type === "navigate") {
            const target = new URL(action.href, location.href);
            target.hash = location.hash;
            location.assign(target.href);
        }
        if (action.type === "open") {
            dialog.close();
            // Reuse the case-study dialog when the card link exists on this page.
            const link = action.caseStudy && document.querySelector(`a[data-case-study][href="${CSS.escape(action.href)}"]`);
            if (link) link.click();
            else if (action.caseStudy) location.assign(action.href);
            else window.open(action.href, "_blank", "noopener");
        }
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const line = input.value;
        input.value = "";
        history.push(line.trim());
        print([`$ ${line}`], "terminal-echo");
        const result = run(line, data, { theme: currentTheme() });
        for (const parts of result.lines) print(parts);
        perform(result.action);
        output.scrollTop = output.scrollHeight;
    });

    input.addEventListener("keydown", (event) => {
        if (event.key === "ArrowUp") {
            event.preventDefault();
            input.value = history.up();
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            input.value = history.down();
        } else if (event.key === "Tab" && input.value.trim()) {
            // Only capture Tab when there is something to complete, so keyboard
            // users can still tab out of an empty prompt.
            event.preventDefault();
            input.value = complete(input.value, data);
        }
    });

    document.addEventListener("keydown", (event) => {
        const shortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
        const backtick = event.key === "`" && !event.ctrlKey && !event.metaKey && !event.altKey && !isTyping(event.target);
        if (shortcut || backtick) {
            event.preventDefault();
            if (dialog.open && shortcut) dialog.close();
            else open();
        }
    });

    dialog.querySelector("[data-terminal-close]").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
    });

    button?.addEventListener("click", open);
    if (button) button.hidden = false;
}

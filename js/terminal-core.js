// Terminal logic without DOM access, so it runs in Node tests. run() turns a
// command line into output lines plus an optional action for the UI to perform.
// A line is a list of parts: plain strings or { text, href } links.

export const COMMANDS = ["help", "whoami", "projects", "open", "stack", "contact", "cv", "lang", "theme", "clear"];

const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

export function parse(input) {
    const [name = "", ...args] = input.trim().split(/\s+/).filter(Boolean);
    return { name: name.toLowerCase(), args };
}

function argOptions(data, name) {
    if (name === "open") return data.projects.map((p) => p.id);
    if (name === "lang") return data.langs.map((l) => l.code);
    if (name === "theme") return ["dark", "light"];
    return [];
}

/** Tab completion: completes the command, then its argument. Returns the new input (or the same). */
export function complete(input, data) {
    const endsWithSpace = /\s$/.test(input);
    const { name, args } = parse(input);
    if (!args.length && !endsWithSpace) {
        const matches = COMMANDS.filter((c) => c.startsWith(name));
        return matches.length === 1 ? `${matches[0]} ` : input;
    }
    const partial = endsWithSpace ? "" : (args[0] ?? "");
    const matches = argOptions(data, name).filter((o) => o.startsWith(partial.toLowerCase()));
    return matches.length === 1 ? `${name} ${matches[0]}` : input;
}

/** Command history with ↑/↓ navigation. */
export function createHistory() {
    const entries = [];
    let index = 0;
    return {
        push(line) {
            if (line && line !== entries.at(-1)) entries.push(line);
            index = entries.length;
        },
        up() {
            index = Math.max(0, index - 1);
            return entries[index] ?? "";
        },
        down() {
            index = Math.min(entries.length, index + 1);
            return entries[index] ?? "";
        },
    };
}

/**
 * data: { s (strings), whoami, cv (PDF URL), projects[{ id, title, status, description, href }],
 *         stack[{ title, items }], contact[{ label, href }], langs[{ code, label, href, current }] }
 * env:  { theme } — current state the UI knows about.
 */
export function run(input, data, env = {}) {
    const { s } = data;
    const { name, args } = parse(input);
    const arg = args[0]?.toLowerCase();

    switch (name) {
        case "":
            return { lines: [] };
        case "help":
            return { lines: COMMANDS.map((c) => [`${c.padEnd(9)} ${s.help[c]}`]) };
        case "whoami":
            return { lines: data.whoami.map((line) => [line]) };
        case "projects":
            return {
                lines: [
                    ...data.projects.map((p) => [`${p.id.padEnd(20)} ${p.status}`]),
                    [s.openHint],
                ],
            };
        case "open": {
            if (!arg) return { lines: [[fill(s.usage, { usage: "open <projeto>" })]] };
            const project = data.projects.find((p) => p.id === arg);
            if (!project) return { lines: [[fill(s.unknownProject, { name: arg })]] };
            return { lines: [[fill(s.opening, { name: project.title })]], action: { type: "open", href: project.href, caseStudy: project.caseStudy } };
        }
        case "stack":
            return { lines: data.stack.map((g) => [`${g.title}: ${g.items.join(", ")}`]) };
        case "contact":
            return { lines: data.contact.map((c) => [`${c.label.padEnd(9)} `, { text: c.text, href: c.href }]) };
        case "cv":
            return { lines: [[s.downloading]], action: { type: "download", href: data.cv } };
        case "lang": {
            const target = data.langs.find((l) => l.code === arg);
            if (!target) return { lines: [[fill(s.usage, { usage: `lang ${data.langs.map((l) => l.code).join(" | ")}` })]] };
            if (target.current) return { lines: [[fill(s.langSame, { lang: target.label })]] };
            return { lines: [[`→ ${target.label}`]], action: { type: "navigate", href: target.href } };
        }
        case "theme": {
            if (arg !== "dark" && arg !== "light") return { lines: [[fill(s.usage, { usage: "theme dark | theme light" })]] };
            if (arg === env.theme) return { lines: [[fill(s.themeSame, { theme: arg })]] };
            return { lines: [[fill(s.themeSet, { theme: arg })]], action: { type: "theme", value: arg } };
        }
        case "clear":
            return { lines: [], action: { type: "clear" } };
        default:
            return { lines: [[fill(s.notFound, { cmd: name })]] };
    }
}

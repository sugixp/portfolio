// Pure helpers for data/github.json: shaping API responses (fetch-github.mjs)
// and summarizing the file for the status board (build).

/** Sums per-repository { language: bytes } maps; shares rounded to 0.1%. */
export function summarizeLanguages(perRepo) {
    const totals = new Map();
    for (const languages of perRepo) {
        for (const [name, bytes] of Object.entries(languages)) totals.set(name, (totals.get(name) ?? 0) + bytes);
    }
    const sum = [...totals.values()].reduce((a, b) => a + b, 0);
    return [...totals]
        .map(([name, bytes]) => ({ name, bytes, share: sum ? Math.round((bytes / sum) * 1000) / 1000 : 0 }))
        .sort((a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name));
}

const EVENT_TYPES = {
    PushEvent: "push",
    CreateEvent: "create",
    PullRequestEvent: "pull-request",
    ReleaseEvent: "release",
    PublicEvent: "publish",
};

/** Keeps the public events worth showing, without payload noise. */
export function simplifyEvent(event) {
    const type = EVENT_TYPES[event.type];
    if (!type) return null;
    const item = { type, repo: event.repo.name.split("/").pop(), date: event.created_at };
    if (type === "push") item.commits = event.payload?.size ?? event.payload?.commits?.length ?? 0;
    return item;
}

/**
 * Languages ranked by how many repositories use them as their main language
 * (ties broken by total bytes). Byte totals alone mislead: a notebook with
 * embedded outputs or one vendored library can outweigh everything else.
 */
export function mainLanguages(github, limit = 2) {
    const counts = new Map();
    for (const repo of github.repos) if (repo.language) counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
    const bytes = Object.fromEntries((github.languages ?? []).map((l) => [l.name, l.bytes]));
    return [...counts]
        .sort((a, b) => b[1] - a[1] || (bytes[b[0]] ?? 0) - (bytes[a[0]] ?? 0) || a[0].localeCompare(b[0]))
        .slice(0, limit)
        .map(([name]) => name);
}

/** What the status board shows: repository count, latest activity, main languages. */
export function boardSummary(github) {
    if (!github?.repos?.length) return null;
    const latest = github.repos
        .filter((r) => r.lastCommit)
        .reduce((a, b) => (!a || b.lastCommit.date > a.lastCommit.date ? b : a), null);
    return {
        repoCount: github.repos.length,
        lastActivity: latest ? { date: latest.lastCommit.date, repo: latest.name } : null,
        mainLanguages: mainLanguages(github),
    };
}

/** "há 3 dias" / "3 days ago", relative to now, at day precision. */
export function relativeDay(isoDate, now, htmlLang) {
    const days = Math.round((Date.parse(now) - Date.parse(isoDate)) / 86_400_000);
    const rtf = new Intl.RelativeTimeFormat(htmlLang, { numeric: "auto" });
    if (days < 31) return rtf.format(-days, "day");
    if (days < 365) return rtf.format(-Math.round(days / 30), "month");
    return rtf.format(-Math.round(days / 365), "year");
}

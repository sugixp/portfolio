// Writes data/github.json from the GitHub REST API: public repositories (no
// forks), languages summed by bytes, the last commit of each repository and
// recent public activity. Run by .github/workflows/github-data.yml once a day;
// the browser never calls the GitHub API.
//
// The file has no "generated at" field on purpose: it only changes when the
// data does, so the scheduled job only commits when there is something new.
// On any API error the script exits non-zero and leaves the old file in place.
//
//   GITHUB_TOKEN=... node scripts/fetch-github.mjs   (token optional, raises rate limits)
import { writeFile } from "node:fs/promises";
import { summarizeLanguages, simplifyEvent } from "./lib/github.mjs";

const USER = process.env.GITHUB_USER || "sugixp";
const API = "https://api.github.com";
const OUT = "data/github.json";

const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": `${USER}-portfolio`,
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

async function get(path, { allow = [] } = {}) {
    const res = await fetch(`${API}${path}`, { headers });
    if (allow.includes(res.status)) return null;
    if (!res.ok) throw new Error(`GET ${path}: HTTP ${res.status} ${await res.text()}`);
    return res.json();
}

// Commits made by this very workflow (it commits data/github.json to the
// portfolio repo) must not count as activity, or each run would change the
// file and trigger another commit the next day.
const BOT = "github-actions[bot]";

async function lastCommit(repo) {
    // 409 = empty repository (no commits yet).
    const commits = await get(`/repos/${USER}/${repo}/commits?per_page=20`, { allow: [409] });
    const c = commits?.find((commit) => commit.author?.login !== BOT && commit.commit.author.name !== BOT);
    if (!c) return null;
    return { sha: c.sha.slice(0, 7), date: c.commit.committer.date, message: c.commit.message.split("\n")[0] };
}

const repos = (await get(`/users/${USER}/repos?per_page=100&type=owner`)).filter((r) => !r.fork && !r.private);

const details = await Promise.all(
    repos.map(async (r) => ({
        repo: r,
        languages: (await get(`/repos/${USER}/${r.name}/languages`)) ?? {},
        lastCommit: await lastCommit(r.name),
    })),
);

const events = await get(`/users/${USER}/events/public?per_page=100`);

const data = {
    $schema: "./schema/github.schema.json",
    user: USER,
    repos: details
        .map(({ repo, languages, lastCommit }) => ({
            name: repo.name,
            description: repo.description,
            url: repo.html_url,
            homepage: repo.homepage || null,
            language: Object.keys(languages)[0] ?? repo.language ?? null,
            stars: repo.stargazers_count,
            archived: repo.archived,
            lastCommit,
        }))
        .sort((a, b) => (b.lastCommit?.date ?? "").localeCompare(a.lastCommit?.date ?? "") || a.name.localeCompare(b.name)),
    languages: summarizeLanguages(details.map((d) => d.languages)),
    recentActivity: events.map(simplifyEvent).filter(Boolean).slice(0, 15),
};

await writeFile(OUT, `${JSON.stringify(data, null, 2)}\n`);
console.log(`✓ ${OUT}: ${data.repos.length} repositories, ${data.languages.length} languages, ${data.recentActivity.length} recent events`);

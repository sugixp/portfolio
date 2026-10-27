// Minimal static server for local development (npm start), without dependencies.
// Serves dist/ under the same base path as GitHub Pages (/portfolio/), including
// the trailing-slash redirect, 404.html and gzip for text files, so local
// behaves (and measures, e.g. in Lighthouse) like production.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const ROOT = resolve("dist");
const PORT = Number(process.env.PORT) || 4173;
const { url: siteUrl } = JSON.parse(await readFile("data/site.json", "utf8"));
const BASE = new URL(siteUrl).pathname; // "/portfolio/"

const TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".ico": "image/x-icon",
    ".pdf": "application/pdf",
    ".woff2": "font/woff2",
};

const COMPRESSIBLE = new Set([".html", ".css", ".js", ".json", ".xml", ".txt", ".svg"]);

async function send(res, status, path, req) {
    let body = await readFile(path); // read first: a missing file must not leave headers half-sent
    const headers = {
        "Content-Type": TYPES[extname(path)] || "application/octet-stream",
        "Cache-Control": "no-store",
    };
    if (COMPRESSIBLE.has(extname(path)) && /\bgzip\b/.test(req.headers["accept-encoding"] ?? "")) {
        body = gzipSync(body);
        headers["Content-Encoding"] = "gzip";
        headers.Vary = "Accept-Encoding";
    }
    res.writeHead(status, headers);
    res.end(body);
}

createServer(async (req, res) => {
    const { pathname } = new URL(req.url, "http://localhost");
    if (pathname === "/" || pathname === BASE.slice(0, -1)) {
        res.writeHead(301, { Location: BASE }).end();
        return;
    }
    const path = normalize(join(ROOT, decodeURIComponent(pathname.slice(BASE.length))));
    // Refuse anything that escapes dist/.
    if (!path.startsWith(ROOT)) {
        res.writeHead(403).end();
        return;
    }

    try {
        if (!pathname.startsWith(BASE)) throw new Error("outside base path");
        if ((await stat(path)).isDirectory()) {
            if (!pathname.endsWith("/")) {
                res.writeHead(301, { Location: `${pathname}/` }).end();
                return;
            }
            return await send(res, 200, join(path, "index.html"), req);
        }
        await send(res, 200, path, req);
    } catch {
        await send(res, 404, join(ROOT, "404.html"), req).catch(() => res.writeHead(404).end("404"));
    }
}).listen(PORT, () => {
    console.log(`Serving dist/ at http://localhost:${PORT}${BASE}`);
});

// Minimal static server for local development (npm start).
// fetch() does not work over file://, so the site needs a real server;
// this avoids adding a dependency just for that.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = resolve(".");
const PORT = Number(process.env.PORT) || 8080;

const TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".webmanifest": "application/manifest+json",
};

createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let path = normalize(join(ROOT, pathname));

    // Refuse anything that escapes the project folder.
    if (!path.startsWith(ROOT)) {
        res.writeHead(403).end();
        return;
    }

    try {
        if ((await stat(path)).isDirectory()) path = join(path, "index.html");
        const body = await readFile(path);
        res.writeHead(200, {
            "Content-Type": TYPES[extname(path)] || "application/octet-stream",
            "Cache-Control": "no-store",
        });
        res.end(body);
    } catch {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("404");
    }
}).listen(PORT, () => {
    console.log(`Serving ${ROOT} at http://localhost:${PORT}`);
});

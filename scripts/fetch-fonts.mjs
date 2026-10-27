// Downloads the latin subset of the site fonts from Google Fonts into
// assets/fonts/, to be served from the site itself. Same files Google would
// serve (OFL-licensed), minus two third-party connections before first paint,
// and they can be preloaded. Run again only to update the fonts:
//   node scripts/fetch-fonts.mjs
// The matching @font-face rules live at the top of css/style.css.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { FONTS_URL } from "../templates/layout.mjs";

const OUT = join("assets", "fonts");
// Google serves woff2 only to browsers that announce support for it.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const css = await (await fetch(FONTS_URL, { headers: { "User-Agent": UA } })).text();
const blocks = [...css.matchAll(/\/\* (\S+) \*\/\s*@font-face\s*{([^}]*)}/g)]
    .filter(([, subset]) => subset === "latin")
    .map(([, , body]) => ({
        family: body.match(/font-family:\s*'([^']+)'/)?.[1],
        url: body.match(/url\((https:[^)]+\.woff2)\)/)?.[1],
    }));
if (!blocks.length || blocks.some((b) => !b.family || !b.url)) throw new Error("Unexpected Google Fonts response; nothing written.");

await mkdir(OUT, { recursive: true });
const done = new Set();
for (const { family, url } of blocks) {
    if (done.has(url)) continue; // variable fonts: one file serves several weights
    done.add(url);
    const file = join(OUT, `${family.toLowerCase().replace(/\s+/g, "-")}-latin.woff2`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
    console.log(`✓ ${file}`);
}

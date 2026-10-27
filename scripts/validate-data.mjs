// Validates every data/*.json file against its schema in data/schema/.
// Runs locally (npm run validate:data) and in CI, so a malformed edit
// fails loudly instead of silently breaking a section of the site.
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const DATA_DIR = "data";
const SCHEMA_DIR = join(DATA_DIR, "schema");

// Data files without a schema (e.g. generated ones) are skipped.
const FILES = {
    "site.json": "site.schema.json",
    "projects.json": "projects.schema.json",
    "stack.json": "stack.schema.json",
    "certifications.json": "certifications.schema.json",
    "experience.json": "experience.schema.json",
};

async function readJSON(path) {
    return JSON.parse(await readFile(path, "utf8"));
}

// Checks JSON Schema cannot express: ids must be unique across the list.
function checkUniqueIds(list, label) {
    const seen = new Set();
    const errors = [];
    for (const item of list) {
        if (seen.has(item.id)) errors.push(`${label}: duplicate id "${item.id}"`);
        seen.add(item.id);
    }
    return errors;
}

async function main() {
    const ajv = new Ajv2020({ allErrors: true });
    addFormats(ajv);

    for (const name of await readdir(SCHEMA_DIR)) {
        ajv.addSchema(await readJSON(join(SCHEMA_DIR, name)), name);
    }

    let failed = false;
    for (const [dataFile, schemaName] of Object.entries(FILES)) {
        const path = join(DATA_DIR, dataFile);
        let data;
        try {
            data = await readJSON(path);
        } catch (err) {
            console.error(`✗ ${path}: ${err.message}`);
            failed = true;
            continue;
        }

        const validate = ajv.getSchema(schemaName);
        const errors = validate(data)
            ? []
            : validate.errors.map((e) => `${e.instancePath || "/"} ${e.message}`);

        if (dataFile === "projects.json" && Array.isArray(data.projects)) {
            errors.push(...checkUniqueIds(data.projects, "projects"));
        }
        if (dataFile === "stack.json" && Array.isArray(data.groups)) {
            errors.push(...checkUniqueIds(data.groups, "groups"));
        }

        if (errors.length) {
            failed = true;
            console.error(`✗ ${path}`);
            for (const e of errors) console.error(`    ${e}`);
        } else {
            console.log(`✓ ${path}`);
        }
    }

    process.exitCode = failed ? 1 : 0;
}

main();

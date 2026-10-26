// Interface strings used by the renderers.
// Temporary home: these move to i18n/pt.json and i18n/en.json in the i18n step.

const STRINGS = {
    pt: {
        featured: "destaque",
        status: {
            deployed: "deploy validado",
            stable: "estável",
            "in-progress": "em desenvolvimento",
            archived: "arquivado",
        },
        repo: "GitHub",
        demo: "Demo",
    },
    en: {
        featured: "featured",
        status: {
            deployed: "deploy verified",
            stable: "stable",
            "in-progress": "in progress",
            archived: "archived",
        },
        repo: "GitHub",
        demo: "Demo",
    },
};

export function strings(lang) {
    return STRINGS[lang] ?? STRINGS.pt;
}

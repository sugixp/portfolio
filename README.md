# portfolio

Portfólio pessoal de Henrique Sugi, publicado em **https://sugixp.github.io/portfolio/**
(português) e **https://sugixp.github.io/portfolio/en/** (inglês).

HTML, CSS e JavaScript puros, sem framework. O conteúdo fica em JSON; um script Node
gera as páginas prontas, e o GitHub Actions publica o resultado no GitHub Pages.

## Arquitetura

```
data/                   conteúdo
  site.json             nome, URL do site, e-mail e links
  projects.json         projetos
  stack.json            ferramentas, agrupadas
  certifications.json   certificações
  experience.json       linha do tempo
  schema/               JSON Schema de cada arquivo acima
i18n/
  pt.json, en.json      textos de interface, um arquivo por idioma
templates/              funções que devolvem HTML (rodam só no build)
  layout.mjs            <head>, barra superior, rodapé, sugestão de idioma
  home.mjs              seções da página inicial
  not-found.mjs         página 404
  seo.mjs               canonical, hreflang, Open Graph, JSON-LD, sitemap, robots
  og-image.mjs          página que vira a imagem de prévia do link
scripts/
  build.mjs             gera dist/ a partir de data/ + i18n/ + templates/
  lib/                  funções puras do build (escape de HTML, i18n, ordenação)
  og-image.mjs          gera assets/og/*.png com o Chrome headless (Playwright)
  serve.mjs             servidor local de dist/, sem dependências
  validate-data.mjs     valida data/*.json contra os schemas
css/style.css           estilos (copiado para dist/)
js/                     JavaScript do navegador, só interatividade (copiado para dist/)
  main.js               ponto de entrada
  project-filter.js     filtro de projetos por tecnologia
  lang-switch.js        troca de idioma e sugestão do idioma preferido
assets/                 favicon, ícone e imagens de prévia (copiado para dist/)
test/                   testes (node:test)
.github/workflows/
  deploy.yml            testa, valida, gera e publica
```

### Fluxo de build e deploy

```
data/*.json ─┐
i18n/*.json ─┼─> scripts/build.mjs ─> dist/
templates/  ─┘                         ├── index.html        (pt-BR)
css/ js/ assets/ ── copiados ────────> ├── en/index.html     (en)
                                       ├── 404.html
                                       ├── sitemap.xml, robots.txt
                                       └── css/ js/ assets/
```

1. A cada push (em qualquer branch) e pull request, o workflow `deploy.yml` roda os
   testes, valida os JSON e gera `dist/`. Se algo falhar, nada é publicado.
2. Na `main`, o mesmo workflow publica `dist/` com `actions/deploy-pages`. O ambiente
   `github-pages` só aceita deploy da `main`.
3. Se um deploy falhar, a versão anterior continua no ar.

### O que acontece no navegador

- **Sem JavaScript**, a página já está completa: projetos, stack, certificações e
  experiência estão no HTML. É isso que robôs de busca e prévias de link (LinkedIn,
  WhatsApp) leem.
- **Com JavaScript**, entram só melhorias: o filtro por tecnologia (o filtro escolhido
  fica na URL, ex.: `?tech=Python`), a troca de idioma que mantém a seção e o filtro, e
  um aviso discreto quando o navegador prefere outro idioma.
- **A troca de idioma é um link comum** (`/` ↔ `/en/`). Não há redirecionamento
  automático: isso esconderia páginas dos buscadores e passaria por cima da escolha
  de quem lê.

### Decisões

- **HTML gerado no build, não no navegador:** o conteúdo aparece sem depender de JS e
  sem "piscar" ao carregar. O build é um script Node curto, sem
  bundler nem framework.
- **Escape automático:** os templates usam a tag `` html`...` `` (`scripts/lib/html.mjs`),
  que escapa todo valor interpolado. Um texto nos dados nunca vira marcação (previne
  XSS), o mesmo princípio de usar `textContent` em vez de `innerHTML`.
- **Dados separados da apresentação:** adicionar um projeto é editar JSON, não HTML.
- **JSON Schema:** o formato dos dados é um contrato. A validação roda antes de todo
  build, e com a chave `"$schema"` o VS Code mostra autocomplete e erros.
- **Chaves de tradução obrigatórias:** uma chave faltando em `i18n/` quebra o build,
  e um teste garante que todos os idiomas têm as mesmas chaves que `pt.json`.
- **Imagens de prévia versionadas:** `assets/og/*.png` muda raramente, então é gerada
  sob demanda (`npm run og`) e comitada. O deploy fica rápido e não precisa de navegador.
- **`robots.txt`:** os buscadores só leem o `robots.txt` da raiz do domínio
  (`sugixp.github.io/robots.txt`), então num site de projeto ele só passa a valer com
  domínio próprio. O sitemap deve ser enviado pelo Google Search Console.

## Rodando localmente

Requer Node.js 20+.

```bash
npm install            # ferramentas de dev (Ajv, Playwright)
npm start              # valida, gera dist/ e serve em http://localhost:4173/portfolio/
npm test               # testes
npm run build          # só gera dist/
npm run validate:data  # só valida data/*.json
npm run og             # regera as imagens de prévia (usa o Chrome instalado)
```

O servidor local imita o GitHub Pages: serve em `/portfolio/`, redireciona pastas sem
barra final e responde com `404.html`. Para usar outra porta: `PORT=5000 npm run serve`.

Depois de editar algo, rode `npm run build` (ou `npm start` de novo) e recarregue.

Rode `npm run og` depois de mudar nome, cargo ou o painel de status, e comite as imagens.

## Como adicionar um projeto

Edite apenas `data/projects.json`, adicionando um objeto ao array `projects`:

```json
{
  "id": "meu-projeto",
  "title": "meu-projeto",
  "description": {
    "pt": "O que o projeto faz, em uma ou duas frases.",
    "en": "What the project does, in one or two sentences."
  },
  "tech": ["Python", "FastAPI"],
  "links": {
    "repo": "https://github.com/sugixp/meu-projeto",
    "demo": "https://sugixp.github.io/meu-projeto/"
  },
  "status": "in-progress",
  "featured": false
}
```

| Campo | Obrigatório | Valores |
| --- | --- | --- |
| `id` | sim | slug único: letras minúsculas, números e hífens |
| `title` | sim | nome exibido no card |
| `description` | sim | `{ "pt", "en" }` (ou uma string, se for igual nos dois idiomas) |
| `tech` | sim | lista de tecnologias; alimenta o filtro automaticamente |
| `links` | sim | `repo` e/ou `demo`, ambos opcionais, sempre `https://` |
| `status` | sim | `deployed`, `stable`, `in-progress` ou `archived` |
| `featured` | sim | `true` exibe o card em destaque, ocupando a linha toda |

Depois:

```bash
npm start   # valida, gera e mostra em http://localhost:4173/portfolio/
```

Comite e dê push na `main`: o workflow publica em cerca de um minuto.

Para **remover** um projeto, apague o objeto do array. Projetos em destaque aparecem
primeiro; os demais seguem a ordem do arquivo.

Stack, certificações e experiência seguem a mesma ideia, em `data/stack.json`,
`data/certifications.json` e `data/experience.json`. Textos de interface (títulos de
seção, botões, painel de status) ficam em `i18n/pt.json` e `i18n/en.json`.

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
  github.json           gerado diariamente pelo workflow github-data.yml (não editar)
  schema/               JSON Schema de cada arquivo acima
i18n/
  pt.json, en.json      textos de interface, um arquivo por idioma
templates/              funções que devolvem HTML (rodam só no build)
  layout.mjs            <head>, barra superior, rodapé, sugestão de idioma
  home.mjs              seções da página inicial
  case-study.mjs        página de estudo de caso (/projects/<id>/)
  cv.mjs                currículo (/cv/), uma coluna, pensado para ATS
  terminal.mjs          diálogo do terminal + dados dos comandos (JSON na página)
  parts.mjs             peças comuns: lâmpada com texto, prévia do projeto
  not-found.mjs         página 404
  seo.mjs               canonical, hreflang, Open Graph, JSON-LD, sitemap, robots
  og-image.mjs          página que vira a imagem de prévia do link
scripts/
  build.mjs             gera dist/ a partir de data/ + i18n/ + templates/
  lib/                  funções puras do build (escape de HTML, i18n, ordenação, GitHub)
  fetch-github.mjs      gera data/github.json pela API do GitHub (usado pelo workflow)
  og-image.mjs          gera assets/og/*.png com o Chrome headless (Playwright)
  fetch-fonts.mjs       baixa as fontes (subconjunto latino) do Google Fonts para assets/fonts/
  project-previews.mjs  captura as demos e gera assets/projects/*.avif|webp (Playwright + sharp)
  cv-pdf.mjs            imprime cada /cv/ em PDF A4 (Playwright), depois do build
  serve.mjs             servidor local de dist/, sem dependências (usado também pelo cv-pdf)
  validate-data.mjs     valida data/*.json contra os schemas
css/style.css           estilos (copiado para dist/)
js/                     JavaScript do navegador, só interatividade (copiado para dist/)
  main.js               ponto de entrada
  project-filter.js     filtro de projetos por tecnologia
  lang-switch.js        troca de idioma e sugestão do idioma preferido
  theme.js              tema claro/escuro (escuro é o padrão)
  case-study.js         abre o estudo de caso num <dialog>
  terminal-core.js      lógica do terminal, sem DOM (testada no Node)
  terminal.js           interface do terminal
  spotlight.js          destaque que segue o cursor nos cards
assets/                 favicon, ícone e imagens de prévia (copiado para dist/)
test/                   testes (node:test)
.github/workflows/
  deploy.yml            testa, valida, gera e publica (também chamado pelo github-data.yml)
  github-data.yml       atualiza data/github.json uma vez por dia e republica
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

### Currículo em PDF

`/cv/` (e `/en/cv/`) é gerado dos mesmos JSON do site e tem CSS de impressão A4. Depois
do build, `npm run cv` abre cada página no Chrome headless e salva o PDF ao lado dela
(`cv/henrique-sugi-curriculo.pdf`, `en/cv/henrique-sugi-resume.pdf`). O workflow de deploy
faz isso a cada publicação, ou seja, a cada push e a cada atualização diária dos dados: o
PDF nunca fica desatualizado em relação ao site.

Pensado para sistemas de triagem (ATS): uma coluna, títulos de seção comuns ("Experiência",
"Formação"...), texto selecionável e links escritos por extenso. O kerning fica desligado
no currículo porque, com ele, o Chrome às vezes grava as palavras sem o caractere de espaço
no PDF, e o texto extraído vira "JPavançado".

Na linha do tempo (`data/experience.json`), `"kind": "education"` manda o item para
"Formação"; os demais vão para "Experiência". Um curso em andamento pode ter `"expectedEnd": "2027-12"`
(ou só o ano), exibido como "2025 – previsão de conclusão dez/2027" / "2025 – expected
Dec 2027". O botão "Baixar currículo" do topo e o comando
`cv` do terminal apontam para o PDF do idioma da página.

### Dados do GitHub

O navegador nunca chama a API do GitHub. Uma vez por dia (ou manualmente, em *Actions →
GitHub data → Run workflow*), `github-data.yml`:

1. roda `scripts/fetch-github.mjs`, que gera `data/github.json` (repositórios públicos sem
   forks, linguagens, último commit de cada repositório e atividade recente);
2. valida o arquivo e **só comita se ele mudou**. O JSON não tem data de geração, e os
   commits do próprio bot são ignorados, para não gerar um commit novo todo dia;
3. chama `deploy.yml` diretamente, porque um push feito com o `GITHUB_TOKEN` não dispara
   outros workflows. O rebuild diário mantém as datas relativas ("há 3 dias") corretas.

Se a API falhar, o arquivo antigo continua. Sem o arquivo, o quadro de status mostra só
as linhas fixas do perfil. As "linguagens principais" contam em quantos repositórios cada
linguagem é a principal, porque o total em bytes é distorcido por notebooks e bibliotecas
copiadas para dentro do repositório.

### O que acontece no navegador

- **Sem JavaScript**, a página já está completa: projetos, stack, certificações e
  experiência estão no HTML. É isso que robôs de busca e prévias de link (LinkedIn,
  WhatsApp) leem.
- **Com JavaScript**, entram só melhorias: o filtro por tecnologia (o filtro escolhido
  fica na URL, ex.: `?tech=Python`), a troca de idioma que mantém a seção e o filtro,
  um aviso discreto quando o navegador prefere outro idioma, o botão de tema, o estudo de
  caso em diálogo e o terminal.
- **Tema:** escuro por padrão. A escolha do claro fica salva e é aplicada por um script de
  uma linha no `<head>`, antes da primeira pintura, para não piscar.
- **Estudos de caso** são páginas de verdade (`/projects/<id>/`): funcionam sem JS, podem
  ser compartilhadas e indexadas. Com JS, o link abre a mesma página num `<dialog>` e muda
  a URL com `pushState`; o "voltar" do navegador fecha o diálogo.
- **Terminal:** Ctrl+K, a tecla `` ` `` (fora de campos de texto) ou o botão `>_`. Comandos:
  `help`, `whoami`, `projects`, `open <projeto>`, `stack`, `contact`, `cv`, `lang pt|en`,
  `theme dark|light`, `clear`. Tab completa e ↑/↓ navegam no histórico.
- **Lâmpadas** (verde, âmbar, apagada) só aparecem onde têm significado e sempre vêm
  com o estado escrito ao lado ("no ar", "em busca"): a cor nunca é a única pista.
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
- **Fontes servidas pelo próprio site:** Archivo e Martian Mono vêm do Google Fonts
  (licença OFL), mas só o subconjunto latino e os eixos usados (Archivo 400–800, larguras
  100–125; Martian Mono 400/500), baixados por `scripts/fetch-fonts.mjs` para
  `assets/fonts/`. Usam `font-display: swap` (o texto aparece na hora, na fonte do
  sistema) e a Archivo, que desenha o nome no topo, tem `preload`. Carregar do Google
  exigia duas conexões externas antes da primeira pintura e fazia o Lighthouse em produção
  oscilar entre 85 e 100; servir daqui remove isso e ainda evita que o visitante faça
  requisições ao Google.
- **Prévias dos projetos:** capturas das demos em AVIF e WebP (640 e 1280 px, 3–55 KB),
  com `<picture>`, `srcset`, `loading="lazy"` e dimensões fixas, para nada pular de
  lugar. Projetos de linha de comando mostram o exemplo do README como texto, não imagem.
- **Movimento:** a entrada por scroll usa `animation-timeline: view()` só onde existe e
  mexe apenas na posição, nunca na opacidade: se a animação não rodar, o conteúdo já está
  no lugar. Destaque com o cursor só com mouse. Tudo desligado com
  `prefers-reduced-motion`. View Transitions na troca de tema e ao abrir estudos de caso.
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
npm run start:drafts   # como npm start, mas mostra também os estudos de caso em rascunho
npm run previews       # recaptura as demos dos projetos (assets/projects/)
npm run previews -- custompc=caminho/imagem.png   # usa uma imagem pronta em vez de capturar
npm run cv             # gera os PDFs do currículo em dist/ (rode depois do build)
```

Para atualizar `data/github.json` localmente (opcional):
`GITHUB_TOKEN=$(gh auth token) node scripts/fetch-github.mjs`.

O servidor local imita o GitHub Pages: serve em `/portfolio/`, redireciona pastas sem
barra final e responde com `404.html`. Para usar outra porta: `PORT=5000 npm run serve`.

Depois de editar algo, rode `npm run build` (ou `npm start` de novo) e recarregue.

Rode `npm run og` depois de mudar nome, cargo ou o painel de status, e `npm run previews`
depois de mudar a demo de um projeto. Comite as imagens geradas.

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
| `preview` | não | imagem no card: `{ "type": "screenshot", "alt": {…} }` (captura de `links.demo`, ou uma imagem pronta via `npm run previews -- <id>=<arquivo>`) ou `{ "type": "terminal", "command", "output": [...] }` (exemplo do README) |
| `highlights` | não | 1 a 3 bullets `{ "pt", "en" }` para o currículo, que os mostra no lugar da `description` |
| `caseStudy` | não | estudo de caso; veja abaixo |

Depois:

```bash
npm start   # valida, gera e mostra em http://localhost:4173/portfolio/
```

Comite e dê push na `main`: o workflow publica em cerca de um minuto.

Para **remover** um projeto, apague o objeto do array. Projetos em destaque aparecem
primeiro; os demais seguem a ordem do arquivo.

### Estudo de caso

Adicione `caseStudy` ao projeto. Todos os textos aceitam `{ "pt", "en" }`:

```json
"caseStudy": {
  "draft": true,
  "problem": { "pt": "…", "en": "…" },
  "architecture": { "steps": [{ "label": "Entrada", "detail": "…" }, { "label": "API" }] },
  "decisions": [{ "pt": "…", "en": "…" }],
  "challenges": [{ "pt": "…", "en": "…" }],
  "learned": [{ "pt": "…", "en": "…" }]
}
```

Enquanto `"draft": true`, nada é publicado: o card não mostra o link e a página não é
gerada. Para revisar, rode `npm run start:drafts`. Para publicar, troque para `false`.

Stack, certificações e experiência seguem a mesma ideia, em `data/stack.json`,
`data/certifications.json` e `data/experience.json`. Textos de interface (títulos de
seção, botões, painel de status) ficam em `i18n/pt.json` e `i18n/en.json`.

## Roadmap

Projeto em pausa desde 27/10/2026. Para retomar: `git pull` (o workflow de dados comita
na `main` todo dia), `npm install` e `npm start`.

### Etapas pendentes

- **4. Versão em japonês:** criar `i18n/ja.json` com `"_meta": { "lang": "ja", "path": "ja/",
  "reviewed": false, … }` e as mesmas chaves de `pt.json` (um teste confere), mais os campos
  `"ja"` nos dados. Enquanto `reviewed` for `false`, `/ja/` não é gerada nem entra no sitemap.
  Carregar uma fonte com japonês só nessa página.
- **5. Notas técnicas (devlog):** posts em Markdown em `content/notes/`, convertidos no build
  (uma lib de Markdown como devDependency), com título, data, tags, tempo de leitura,
  idioma, filtro por tag e feed RSS. Começar com uma nota de exemplo marcada como rascunho.
- **6. Gráficos com os dados do GitHub:** heatmap de atividade em SVG com versão em texto,
  barras de linguagens e, nos cards, a última atualização e a linguagem principal. Os dados
  já estão em `data/github.json`; para o heatmap, a API de eventos cobre só 90 dias, então
  talvez seja preciso a API GraphQL (`contributionsCollection`).
- **7. Qualidade:** testes end-to-end com Playwright na CI (navegação, filtro, diálogo,
  terminal, idioma e tema, no desktop e no celular), axe nas páginas principais, Lighthouse
  CI (`numberOfRuns: 3`, mínimo 0.9, performance como aviso) e botão "copiar e-mail" no
  contato, com feedback acessível. O `@playwright/test` já está nas devDependencies.

### Conteúdo pendente

- **Experiência no Japão:** trocar as `description` da Mitsubishi e da Advics em
  `data/experience.json` pelos textos finais.
- **Estudos de caso:** escrever o `learned` ("O que aprendi") de `currency-converter` e
  `task-manager` em `data/projects.json`, revisar o resto e trocar `"draft"` para `false`.
- **Prévias:** gravar GIFs dos projetos de linha de comando, se quiser substituir o texto
  do terminal.

### Adicionar um projeto, em resumo

1. Acrescente um objeto ao array em `data/projects.json` (campos na seção
   [Como adicionar um projeto](#como-adicionar-um-projeto)).
2. Opcional: `"preview": { "type": "screenshot", "alt": {…} }` e `npm run previews` (captura
   a demo), ou `"preview": { "type": "terminal", … }` com o exemplo do README.
3. `npm start` para conferir (o filtro, o terminal e o currículo se atualizam sozinhos).
4. Comite as imagens geradas e dê push na `main`. O deploy publica o site e o PDF.

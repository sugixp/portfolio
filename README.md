# portfolio

Portfólio pessoal de Henrique Sugi, publicado em **https://sugixp.github.io/portfolio/**.

HTML, CSS e JavaScript puros (ES modules), sem framework e sem build step: o que está
neste repositório é exatamente o que o GitHub Pages serve.

## Arquitetura

```
index.html              esqueleto semântico + conteúdo de fallback
css/style.css           design tokens em :root e estilos por seção
js/
  main.js               ponto de entrada: carrega cada data/*.json e monta a seção
  lang.js               estado do idioma (PT/EN) e aviso de troca para as seções
  lib/                  funções puras, sem DOM — testadas com node --test
    dom.js              h() para criar elementos (nunca innerHTML) e loadJSON()
    localize.js         resolve textos { pt, en }
    projects.js         ordenação e filtro por tecnologia
    strings.js          textos de interface (vão para i18n/ na etapa de i18n)
  render/               uma função mount*() por seção
data/
  projects.json         projetos
  stack.json            ferramentas, agrupadas
  certifications.json   certificações
  experience.json       linha do tempo
  schema/               JSON Schema de cada arquivo acima
scripts/
  serve.mjs             servidor estático local, sem dependências
  validate-data.mjs     valida data/*.json contra os schemas
test/                   testes unitários (node:test)
```

### Fluxo de renderização

1. O HTML já chega com a estrutura da página e, em cada seção dinâmica, uma mensagem
   de fallback com link (GitHub ou LinkedIn).
2. `main.js` busca cada arquivo de `data/` **de forma independente**. Os arquivos são
   pré-carregados com `<link rel="preload">`, em paralelo com o JS.
3. Se o fetch der certo, a seção é renderizada e substitui o fallback. Se falhar, o
   fallback continua na tela e só aquela seção é afetada.
4. Ao trocar o idioma, `lang.js` avisa as seções (`onLangChange`) e elas se
   redesenham com os textos do novo idioma.

### Decisões

- **Sem framework/build:** o site é pequeno; o custo de um bundler não se paga, e
  publicar direto no Pages mantém o deploy trivial.
- **Dados separados da apresentação:** adicionar um projeto é editar JSON, não HTML.
- **JSON Schema:** o formato dos dados é um contrato. A validação pega erros antes do
  deploy e, com a chave `"$schema"`, o VS Code mostra autocomplete e erros enquanto
  você edita.
- **Sem `innerHTML`:** todo conteúdo entra via `textContent`/atributos, então um texto
  nos dados nunca vira marcação.
- **`package.json` só para ferramentas de desenvolvimento:** nada dele é carregado
  pelo site.

## Rodando localmente

Requer Node.js 20+.

```bash
npm install            # instala as ferramentas de dev (Ajv)
npm start              # http://localhost:8080
npm test               # testes unitários
npm run validate:data  # valida data/*.json
```

> Abrir o `index.html` direto (`file://`) não funciona: navegadores bloqueiam
> `fetch()` de arquivos locais, então as seções ficariam no fallback.

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
npm run validate:data   # confere o formato
npm start               # confere visualmente
```

Para **remover** um projeto, apague o objeto do array. Projetos em destaque aparecem
primeiro; os demais seguem a ordem do arquivo.

Stack, certificações e experiência seguem a mesma ideia, em `data/stack.json`,
`data/certifications.json` e `data/experience.json`. O schema de cada um está em
`data/schema/`.

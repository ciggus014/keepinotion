# Keepinotion

Um fork do [AppFlowy Web](https://github.com/AppFlowy-IO/appflowy-web) com o objetivo de ser
uma alternativa open source ao Notion mais fiel ao original.

## O que este fork muda

| Mudança | Estado |
|---|---|
| **Gráficos sem limite de plano** — Bar, Line, Horizontal Bar e Donut liberados para todos os planos | ✅ |
| **Paleta Notion-like** — azul sóbrio `#2383e2` no lugar do ciano AppFlowy, tema claro e escuro | ✅ |
| **Embed de widgets externos** (Indify, Blocky, Widgets for Notion) | 🚧 planejado |
| **Galeria de templates nativos** (meeting notes, wiki, task list, OKR…) | 🚧 planejado |

O plano de execução detalhado fica em [`ROADMAP.md`](./ROADMAP.md).

### Limitação conhecida: quota de gráficos no servidor

O desbloqueio de gráficos é **client-side**. Com o AppFlowy Cloud oficial como backend, o
endpoint `database-view-creation-status` ainda reporta `can_create_chart`, e o servidor pode
recusar a **criação de um gráfico novo** no plano Free. Os tipos de gráfico dentro de um
gráfico já existente estão liberados. Para desbloquear a criação de fato é preciso um backend
próprio (self-hosted) — ver ROADMAP.

## Desenvolvimento

Requisitos: Node.js ≥ 18, pnpm ≥ 10.9.

```bash
pnpm install
pnpm run dev
```

O dev server abre em `http://localhost:3000`.

### Apontando para um backend

O frontend precisa de um backend AppFlowy Cloud. Crie um `.env.local` na raiz:

```bash
APPFLOWY_BASE_URL=https://beta.appflowy.cloud
APPFLOWY_GOTRUE_BASE_URL=https://beta.appflowy.cloud/gotrue
APPFLOWY_WS_BASE_URL=wss://beta.appflowy.cloud/ws/v2
```

> Use `beta.appflowy.cloud` (produção). O `test.appflowy.cloud` é o ambiente de staging e
> **recusa cadastro de emails não autorizados** — o login falha com "You don't have permission".

Para rodar o backend localmente (recomendado para self-hosted, sem limites de plano):
siga o [guia do AppFlowy Cloud](https://github.com/AppFlowy-IO/AppFlowy-Cloud).

### Verificação

```bash
pnpm type-check                          # tsc --noEmit -p tsconfig.web.json
npx jest --coverage=false <arquivo>      # testes unitários
pnpm build                               # build de produção
```

## Licença e atribuição

Este projeto é derivado do AppFlowy Web, distribuído sob **AGPL-3.0** (ver `LICENSE`).
Por ser um fork AGPL-3.0, qualquer instância hospedada deste software precisa oferecer o
código-fonte correspondente aos seus usuários.

AppFlowy é uma marca do AppFlowy IO, Inc. Este fork não é afiliado nem endossado pelo
projeto AppFlowy.

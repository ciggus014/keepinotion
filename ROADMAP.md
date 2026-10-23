# Keepinotion — Roadmap de fidelidade ao Notion

## Entregue (commit e704a6e)
- **Gráficos ilimitados**: removido o gating premium de tipos de chart (Line, HorizontalBar, Donut agora livres em qualquer plano); criação de views de chart não é mais limitada por plano no client (`isLimitedDatabaseViewLayout`, `WorkspacePlanPolicy.requiresOnlineViewCreation`). O servidor pode ainda rejeitar via quota (`can_create_chart`) — ver "Pendente".
- **UI/UX Notion-like**: paleta ciano AppFlowy (#00bcf0) substituída por azul sóbrio #2383e2 e tons derivados, em light e dark variables.

## Pendente — próxima etapa
### 1. Bloco de embed nativo (estilo Notion /embed)
- Estado atual: existe `EmbedLink` (input de URL) e bloco `link-preview`, mas não há embed genérico via iframe.
- Caminho sugerido: novo bloco `embed` seguindo o padrão de `link-preview` (pasta em `src/components/editor/components/blocks/`), com whitelist de provedores (YouTube, Vimeo, Google Maps, Figma, Spotify etc.), sandbox de iframe e fallback de link.
- Custo real: blocos novos podem exigir mudanças de protobuf (`src/proto`) e do parser de markdown — avaliar antes de implementar.
- Referência: os apps "Indify/Blocky/Widgets for Notion" entregam widgets via embed URL; um bloco iframe genérico cobre os três.

### 2. Templates nativos estilo Notion
- Estado atual: sistema de templates existe (API em `template-api.ts`, UI em `src/components/as-template/`), mas não há galeria de presets built-in.
- Caminho sugerido: pacote de presets (meeting notes, wiki, task list, weekly planner, OKR) como documentos default criados via `create-default-view`/row-template, expostos num seletor de "New page → Templates".

### 3. Verificação server-side
- O endpoint `/api/workspace/{id}/database-view-creation-status` ainda reporta `can_create_chart`; se o backend for AppFlowy Cloud padrão, a criação do N-ésimo chart pode falhar no servidor mesmo com o client liberado. Se o backend for próprio, remover a quota lá também.

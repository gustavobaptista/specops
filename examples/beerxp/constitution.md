# BeerXP — Constitution

> Princípios de governança do projeto. Leia antes de qualquer decisão de produto ou técnica.
> Todo agent, skill e sessão de desenvolvimento deve respeitar estas regras.

---

## Visão do Produto

**BeerXP** é uma rede social para amantes de cerveja — concorrente do Untappd.

- **Métrica North Star:** MAU (Monthly Active Users)
- **Loop de engajamento:** `CRIAR → COMPARTILHAR → REAGIR → DESCOBRIR → CRIAR`
- Toda feature deve se encaixar em um dos quatro momentos do loop. Se não se encaixar, questionar a prioridade.

---

## Princípios de Produto (inegociáveis)

1. **Gamificação premia diversidade de estilos, NUNCA quantidade de consumo** — premiar quem bebe mais é irresponsável e vai contra o posicionamento do produto
2. **MVP primeiro** — lançar o mínimo que valida o valor, depois iterar
3. **Melhorias incrementais > features novas** em cima de base instável
4. **Confirmação de maioridade** obrigatória no cadastro
5. **Respeitar legislação** de publicidade de bebidas alcoólicas

---

## Anti-padrões de Produto (nunca implementar)

- Notificações manipulativas ou FOMO artificial
- Gamificação que premia volume de drinks (deve premiar diversidade de estilos)
- Scroll infinito sem indicador de progresso
- Campos obrigatórios demais no check-in
- Dark patterns de engajamento

---

## Governança Técnica

### Stack

| Camada | Tecnologia |
|--------|-----------|
| App mobile | Flutter 3.x, Riverpod 3 (`@riverpod` + `Notifier`), go_router 17 |
| Admin web (backoffice) | React 19, TypeScript 5, Vite 6, Tailwind CSS v3, shadcn/ui, TanStack Query v5, react-hook-form v7 + zod |
| Backend | Firebase Cloud Functions v2, TypeScript 5, Node.js 22 |
| Banco de dados | Firestore (coleções PascalCase) |
| IA — texto | Gemini 2.5-flash |
| IA — embeddings de imagem | Vertex AI `multimodalembedding@001` |
| IA — geração de imagem | Imagen |
| Analytics | Firebase Analytics + PostHog (multi-provider via `AnalyticsProvider`) |

### Regras Absolutas de Backend

- **v1 apenas para auth triggers** (`onCreate`, `onDelete`) — v2 não suporta auth triggers
- **v2 para tudo mais** — Firestore triggers, HTTP callables, schedules
- **Região padrão:** `southamerica-east1` (via `setGlobalOptions` no `index.ts`)
- **Exceção de região:** `us-central1` obrigatório para `multimodalembedding@001` (único lugar disponível)
- **Logging:** `firebase-functions/logger` — nunca `console.log()`
- **Secrets:** `defineSecret()` — nunca hardcoded
- **Auth Google AI:** Application Default Credentials — sem API keys
- **App Check:** `enforceAppCheck: true` em HTTP callables de produção
- **Validação de input:** Zod `safeParse()` em todos os callables
- **Coleções Firestore:** constantes PascalCase no topo do arquivo (`const beersCollection = 'Beers'`)

### Regras Absolutas de Frontend

- **State management:** Riverpod 3 `@riverpod` annotation com `Notifier` — **nunca** `StateNotifier`, BLoC, GetIt, `ChangeNotifier`
- **Roteamento:** go_router 17 — sem `Navigator.push` direto
- **Logging:** `LogService` — nunca `print()`
- **Error handling:** `guardFirebase()` para operações Firebase
- **Strings de UI:** sempre `AppLocalizations` — nunca strings hardcoded
- **Testes:** `mocktail` — nunca `mockito`
- **Code gen:** rodar `dart run build_runner build --delete-conflicting-outputs` após modificar providers

### Princípios de Código (YAGNI · KISS · DRY)

Quando os três entram em conflito, use esta hierarquia:

1. **YAGNI** — não construa o que o spec/tasks não pediu. Funcionalidade especulativa tem custo real: aumenta superfície de teste, complica review e acopla o futuro a suposições erradas.
2. **KISS** — da menor quantidade de código que resolve o problema, escolha o mais legível. Elegância que dificulta debug não é elegância.
3. **DRY** — só depois de ter código funcionando elimine duplicação *real* (não antecipada). Acoplamento prematuro é mais caro de desfazer do que duplicação localizada.

**Regra prática — "duplicate once, abstract twice":**
- Primeira ocorrência: escreva inline.
- Segunda ocorrência: tolere a duplicação, mas anote.
- Terceira ocorrência: extraia. Agora você conhece o padrão real, não o imaginado.

**DRY tem peso diferente por camada:**
- **Regras de negócio** (validações Zod, thresholds, enums de domínio): DRY obrigatório — duplicação de conhecimento cria divergência silenciosa.
- **Código de infraestrutura** (services, queries, triggers): DRY quando a terceira ocorrência aparecer.
- **Código de UI** (widgets, componentes): KISS domina — três `if` legíveis valem mais que um helper opaco.

**Anti-padrões que violam essa hierarquia (nunca fazer):**
- Criar `BaseService`, `GenericRepository` ou `useGenericQuery` na primeira feature.
- Adicionar parâmetros opcionais "para o futuro" que nenhum caller usa ainda.
- Extrair um helper com um único caller sem justificativa clara.
- Adicionar error handling para cenários que não existem no sistema.

---

### Coleções Firestore (PascalCase — deliberado)

| Coleção | Uso |
|---------|-----|
| `Users` | Perfis de usuários |
| `Beers` | Catálogo (inclui `embedding: number[]` para vector search) |
| `GlobalDrinkIns` | Feed global de drink-ins |
| `Pubs` | Estabelecimentos |
| `Trending` | Rankings regionais por geohash |

### Ambientes

| Branch | Ambiente | Firebase Project |
|--------|----------|-----------------|
| `develop` | dev | `beerxp-dev-new` |
| `staging` | stg | `beerxp-stg` |
| `main` | prod | `beerxp-prd` |

PRs sempre para `develop`. Nunca direto para `main` ou `staging`.

---

## Decisões de Arquitetura Registradas

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Embeddings de imagem | Vertex AI `multimodalembedding@001` em `us-central1` | Modelo não disponível em `southamerica-east1` |
| Coleções Firestore | PascalCase | Decisão original do projeto — não alterar por consistência |
| State management | Riverpod 3 Notifier | `.cursorrules` menciona BLoC/GetIt incorretamente — ignorar |
| Mocking em testes | mocktail | Padrão do projeto — não usar mockito |
| Auth triggers | Firebase Functions v1 | v2 não suporta auth triggers |
| Scan de thresholds | ≥90% direto, 50-89% candidatos, <50% snackbar | Validado na feature de label scan |

---

## Workflow de Desenvolvimento de Features

```
product-discovery → spec-generator → task-generator → backend-implementer + frontend-implementer (paralelo)
                                                                          ↓
                                                                   qa-agent (futuro)
                                                                          ↓
                                                                  human review (2 PRs)
```

O `product-discovery` é o passo de discovery de negócio (opcional quando a ideia já é clara): entrevista o PO 100% em linguagem de produto e gera o `brief.md`, entrada para o `spec-generator`.

Specs ficam em: `docs/specs/YYYY-MM-DD-nome-da-feature/` (raiz do projeto)
- `brief.md` — discovery de produto, em linguagem de negócio (gerado por `product-discovery`)
- `spec.md` — o quê e por quê, técnico (gerado por `spec-generator`)
- `tasks.md` — tarefas rastreáveis com IDs (gerado por `task-generator`)

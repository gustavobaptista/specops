# Label Scan — Design Spec
**Data:** 2026-04-05
**Projetos afetados:** beerxp (app mobile), beerxp-functions (Cloud Functions)

---

## Visão Geral

Feature de reconhecimento de rótulo de cerveja por imagem, similar ao Vivino para vinhos. O usuário aponta a câmera para o rótulo de uma cerveja, a IA identifica a cerveja pelo visual e abre a `BeerDetailsScreen` — que já tem o botão de drink-in, cobrindo ambos os casos de uso (identificar e registrar).

---

## Escopo do MVP

- Reconhecimento por similaridade visual (embeddings de imagem via Gemini)
- Dois pontos de entrada: ícone 📷 na busca mobile + FAB na home mobile
- Resultado único (>90% de similaridade): navega direto para `BeerDetailsScreen`
- Resultado ambíguo (50–90%): bottom sheet com top-3 candidatos e % de match
- Não reconhecido (<50%): snackbar com link para busca manual

**Fora do escopo do MVP:**
- Leitura de código de barras/QR code
- Cadastro de cerveja nova a partir do scan
- Suporte a desktop/web (câmera é funcionalidade mobile-first)

---

## Fluxo do Usuário

```
Usuário toca 📷 (busca ou FAB)
        ↓
LabelScanScreen — viewfinder com guia de enquadramento
        ↓
Usuário captura foto
        ↓
Loading: "Analisando rótulo..." (Gemini processa)
        ↓
similarity > 0.90 → push('/beers/{id}')
similarity 0.50–0.90 → bottom sheet com top-3 candidatos
similarity < 0.50 → snackbar "não reconheci" + foco na busca manual
```

---

## Arquitetura

### App Mobile (Flutter)

#### Novos arquivos

| Arquivo | Responsabilidade |
|---|---|
| `features/scan/presentation/pages/label_scan_screen.dart` | Câmera com viewfinder, botão de captura, feedback visual |
| `features/scan/presentation/providers/label_scan_provider.dart` | Estado: `idle → capturing → loading → result → error` |
| `features/scan/presentation/widgets/scan_candidates_sheet.dart` | Bottom sheet com lista de candidatos e % de match |
| `core/services/label_scan_service.dart` | Interface + implementação: chama Cloud Function, retorna `List<BeerScanResult>` |

#### Modelo

```dart
class BeerScanResult {
  final BeerModel beer;
  final double similarity; // 0.0–1.0
}
```

#### Entry points

**Busca mobile** — adicionar `IconButton` com `Icons.camera_alt` nas `actions` do `AppBar` em `search_mobile.dart`, visível apenas na aba de cervejas (`_tabIndex == 0`).

**Home mobile** — adicionar `FloatingActionButton` em `home_mobile.dart` (o Scaffold atual não tem FAB). Ícone: `Icons.camera_alt`. Navega para `LabelScanScreen`.

#### Rota

```dart
GoRoute(path: '/scan/label', builder: (_, __) => const LabelScanScreen())
```

#### Dependência

```yaml
# pubspec.yaml
camera: ^0.11.0   # ou image_picker — avaliar qual tem melhor UX para captura única
```

`image_picker` é preferível se o objetivo é apenas capturar uma foto (mais simples, sem gerenciar lifecycle da câmera). `camera` dá mais controle sobre viewfinder customizado. **Decisão de implementação:** usar `image_picker` com `ImageSource.camera` para o MVP — evita complexity do package `camera`.

---

### Cloud Functions (TypeScript)

#### `onScanLabel` — HTTP Callable

**Entrada:**
```typescript
{ imageBase64: string } // JPEG comprimido, max 1MB
```

**Processamento:**
1. Gera embedding da imagem via `gemini-embedding-exp-03-07` (multimodal)
2. Executa `findNearest` no Firestore: collection `beers`, campo `embedding`, top-5, `distanceMeasure: COSINE`
3. Converte distância em similaridade: `similarity = 1 - distance`
4. Filtra resultados com `similarity >= 0.50`

**Saída:**
```typescript
{ results: Array<{ beerId: string; similarity: number }> }
```

#### `onBeerImageUpdated` — Firestore trigger

**Trigger:** `onDocumentWritten('beers/{beerId}')`

**Lógica:**
1. Se `imageUrl` foi criado ou alterado:
2. Baixa a imagem da URL
3. Gera embedding via Gemini
4. Salva `embedding: number[]` no documento

---

### Firestore

#### Campo novo em `beers/{id}`

```
embedding: array<float>  // 1408 dimensões (multimodalembedding@001 do Vertex AI)
```

#### Vector index (`firestore.indexes.json`)

```json
{
  "indexes": [],
  "fieldOverrides": [
    {
      "collectionGroup": "beers",
      "fieldPath": "embedding",
      "indexes": [
        {
          "order": "ASCENDING",
          "queryScope": "COLLECTION"
        },
        {
          "arrayConfig": "CONTAINS",
          "queryScope": "COLLECTION"
        }
      ],
      "vectorConfig": {
        "dimension": 1408,
        "flat": {}
      }
    }
  ]
}
```

#### Script de indexação inicial (one-time)

Cloud Function admin (`indexExistingBeers`) que itera todas as cervejas com `imageUrl` e sem `embedding` e gera os embeddings em batch. Executar uma vez após o deploy.

---

## Segurança

- `onScanLabel` requer usuário autenticado (`context.auth`)
- Imagem recebida é validada: tamanho máximo 1MB, formato JPEG/PNG
- `onBeerImageUpdated` é trigger interno — sem surface de ataque externa

---

## Tratamento de Erros

| Situação | Comportamento |
|---|---|
| Câmera negada pelo usuário | Snackbar com link para configurações do sistema |
| Cloud Function timeout | Snackbar "Tente novamente" + botão de retry |
| Cerveja sem `embedding` no catálogo | Não aparece nos resultados (filtrada automaticamente) |
| Gemini indisponível | Log de erro + fallback para busca manual |

---

## Localização (l10n)

Strings novas necessárias (pt-BR e en-US):

- `scanLabel` — "Escanear rótulo" / "Scan label"
- `scanPointCamera` — "Aponte para o rótulo" / "Point at the label"
- `scanAnalyzing` — "Analisando rótulo..." / "Analyzing label..."
- `scanNotFound` — "Não reconheci essa cerveja" / "Couldn't recognize this beer"
- `scanSearchManually` — "Buscar manualmente" / "Search manually"
- `scanIsItOne` — "É uma dessas?" / "Is it one of these?"
- `scanMatch` — "{percent}% de match" / "{percent}% match"
- `scanCameraPermissionDenied` — "Permissão de câmera negada" / "Camera permission denied"

---

## Testes

- Unitário: `LabelScanService` mockando a Cloud Function (mocktail)
- Unitário: `LabelScanNotifier` — transições de estado
- Widget: `ScanCandidatesSheet` — renderiza corretamente com lista de candidatos
- Widget: `LabelScanScreen` — estados de loading e erro

---

## Notas de Evolução Futura

> **TODO (pós-crescimento):** Quando o catálogo superar ~50k cervejas ou o custo do Firestore vector search se tornar relevante, migrar para **Vertex AI Vector Search**. O contrato da `LabelScanService` no app não muda — apenas a implementação da Cloud Function `onScanLabel`. A migração é transparente para o app mobile.

---

## Ordem de Implementação

1. **Cloud Functions** — `onBeerImageUpdated` (trigger de indexação) + `onScanLabel` (HTTP callable)
2. **Script one-time** — indexar cervejas existentes que já têm `imageUrl`
3. **App mobile** — `LabelScanScreen`, provider, service, entry points, rota
4. **Testes**

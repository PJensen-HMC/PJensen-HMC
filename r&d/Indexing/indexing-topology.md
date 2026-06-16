# Research Management — Document Indexing Topology

Full end-to-end topology of how documents are ingested, chunked, embedded, and stored in the Azure AI Search index.

---

## Overview

Documents enter the indexing pipeline from three sources: a periodic sweep (new/updated/deleted), direct Service Bus commands from other services, and the HTTP indexing controller. All paths converge at `IndexingService.IndexObjectAsync()` in `HMC.Shared.ResearchManagementIndex`.

---

## Mermaid: Full Pipeline

```mermaid
flowchart TD
    subgraph Triggers["Trigger Sources"]
        SWEEP["DocumentSweepService\n(IndexDocumentSweepCommand)"]
        SB_CMD["Service Bus Commands\n(IndexNote / IndexAttachment / IndexDocument / IndexDelete)"]
        HTTP["IndexingController\nHTTP API"]
    end

    subgraph ResearchMgmt["Crimson.Legacy — HMC.ResearchManagement.Service"]
        SWEEP -->|"query SQL DB for created/updated since last sweep\nfilter out already-indexed IDs\nbatch publish IndexDocumentCommand × N"| BUS_OUT
        SB_CMD --> HANDLER["IndexingCommandHandler\n(ICommandHandler<T>)"]
        HTTP --> RIS

        HANDLER --> RIS["ResearchIndexingService"]

        RIS -->|"IndexNoteAsync\nHTML = CombineHtml(summary, content)"| IOS
        RIS -->|"IndexAttachmentAsync\nbinary from DB"| IOS
        RIS -->|"IndexDocumentAsync\nbinary from DB"| IOS
        RIS -->|"each attachment → publish IndexAttachmentCommand"| BUS_OUT

        BUS_OUT["Azure Service Bus"]
        BUS_OUT -->|"IndexDocumentCommand"| HANDLER
    end

    subgraph SharedIndex["Shared — HMC.Shared.ResearchManagementIndex"]
        IOS["IndexingService.IndexObjectAsync()\nbytes + filename + ResearchIndexSharedFields"]

        IOS -->|"TryGetAsync(id)"| BCACHE["ResearchIndexBlobCache\nAzure Blob: research-index-cache-14/{id}.bin\nGZip compressed JSON of ResearchIndex[]"]

        BCACHE -->|"cache HIT → return ResearchIndex[]"| SKIP_CHAT
        BCACHE -->|"cache MISS → call ChatAI"| CHATAI_CALL

        SKIP_CHAT["skip ChatAI call\nuse cached chunks + vectors"]

        CHATAI_CALL["IChatAiClient.Document\n.EmbeddingsFromFileAsync()\nHTTP POST /Document/Analyze?jobType=ChunkAndVectorize"]

        CHATAI_CALL --> CHATAI

        SKIP_CHAT --> BUILD
        CHATAI --> BUILD

        BUILD["build ResearchIndex[]\nChunkId = {Id}-{i:X4}\nContent = chunk text\nContentVector = float[]\n+ shared fields"]

        BUILD --> SEARCH_WRITE
        BUILD -->|"cache miss → AddAsync(shared, chunks)"| BCACHE

        SEARCH_WRITE["IndexChunksAsync()\ndual-write Azure AI Search"]
        SEARCH_WRITE --> SEARCH_PRIMARY["Azure AI Search — Primary (East)\nSearchClient"]
        SEARCH_WRITE --> SEARCH_SECONDARY["Azure AI Search — Secondary (West)\nSearchClient"]
    end

    subgraph ChatAISvc["CoreServices — HMC.ChatAI.Service"]
        CHATAI["DocumentController\nDocumentAnalysisJob"]

        CHATAI --> EXTRACT["Extraction\nPDF (PdfPig + Docnet + iText)\nWord / Excel (DocumentFormat.OpenXml)\nHTML (HtmlAgilityPack)\nAudio → Whisper (NAudio + FFmpeg)\nImage → Azure Doc Intelligence OCR\nor Machine Vision"]

        EXTRACT --> CHUNK["Chunking\nDocumentIntelligenceChunkingStrategy\n\nAzure Form Recognizer analyzes document\n→ paragraphs + tables + footnotes\n→ overlap window applied\nmin/max chunk size configurable\noutput: string[]"]

        CHUNK --> VECTORIZE["VectorizationService\nOpenAI EmbeddingClient\nbatched, in-memory cache\ndefault model: text-embedding-ada-002\n\noutput: float[][] (1536-dim per chunk)"]

        VECTORIZE --> CHUNKFRAG["return ChunkFrag[]\nrecord ChunkFrag(string Chunk, float[] Embedding)\n\nvia HTTP response → caller"]
    end

    subgraph DeleteSweep["Delete Sweep Path"]
        SWEEP -->|"SweepDeletedAsync"| DEL_CACHE["GetAllBlobFilenamesAsync()\nlist all {id}.bin in blob cache"]
        DEL_CACHE -->|"compare with SQL DB\nfind orphans"| DEL_SEARCH["HardDeleteAsync(orphanIds)\nremove from both search clients"]
    end
```

---

## Step-by-Step: Document Ingestion

### 1. Trigger

Three paths trigger indexing:

| Path | Mechanism |
|---|---|
| **Periodic sweep** | `IndexDocumentSweepCommand` → `DocumentSweepService.SweepAsync()` |
| **On-demand / reactive** | `IndexNoteCommand`, `IndexAttachmentCommand`, `IndexDocumentCommand` via Service Bus |
| **Manual / API** | `IndexingController` HTTP endpoints |

**Sweep logic (`SweepCreatedOrUpdatedAsync`):**
1. Query SQL DB: all docs with supported file types where `CreationTime >= lastSweep OR LastWriteTime >= lastSweep`
2. Call `IndexingService.FindMissingEntriesAsync()` — parallel AI Search lookup to exclude already-indexed IDs
3. Publish `IndexDocumentCommand` in batches of 100 to Service Bus
4. Update `lastSweepTime`

---

### 2. ResearchIndexingService — Load Content from DB

`IndexingCommandHandler` routes each command to `ResearchIndexingService`:

| Command | Content loaded | Entry type |
|---|---|---|
| `IndexNoteCommand` | `CombineHtml(note.Summary, note.Content)` → UTF-8 bytes | `Note` |
| `IndexAttachmentCommand` | `ResearchAttachment.Data` (raw binary from DB) | `Attachment` |
| `IndexDocumentCommand` | `RawData` binary from Documents DB | `Document` |

For notes: also publishes `IndexAttachmentCommand` for each child attachment (unless `skipAttachments = true`).

All paths call `IndexingService.IndexObjectAsync(bytes, fileName, sharedFields, force, quality)`.

---

### 3. IndexingService — Cache Check

```
ResearchIndexBlobCache.TryGetAsync(id)
  → Azure Blob container: research-index-cache-14
  → blob name: {id}.bin
  → content: GZip compressed JSON of ResearchIndex[]
```

- **Cache hit**: skip ChatAI entirely, use stored `ResearchIndex[]`
- **Cache miss** (or `force=true`): call ChatAI

---

### 4. ChatAI Service — Extract → Chunk → Vectorize

HTTP POST to `ChatAI /Document/Analyze?jobType=ChunkAndVectorize&quality={low|medium|high|variable}`

#### 4a. Extraction

| File type | Extractor |
|---|---|
| PDF | PdfPig (text layer) → fallback Docnet + iText OCR |
| Word (.docx) | DocumentFormat.OpenXml |
| HTML | HtmlAgilityPack with compression |
| Audio (.mp3, .wav, etc.) | NAudio + FFmpeg split → OpenAI Whisper transcription |
| Images (.png, .jpg) | Azure Document Intelligence OCR or Machine Vision |
| Text / CSV | Direct read |
| ZIP | Extracts and processes each supported file inside |

Output: raw text string + `ExtractOptions` metadata (pageCount, etc.)

#### 4b. Chunking (`DocumentIntelligenceChunkingStrategy`)

1. Send text to Azure Form Recognizer (Doc Intelligence)
2. Extract paragraphs, tables (`[Table] ...`), footnotes (`[Footnote] ...`)
3. Apply configurable min/max chunk size with overlap window
4. Output: `string[]` of chunk texts

Chunk size defaults: `MinChunkSize = 600`, `MaxChunkSize = 1200` chars. Overlap: trailing context from prior chunk prepended.

#### 4c. Vectorization (`VectorizationService`)

1. Batch chunks (configurable batch size)
2. Call OpenAI `EmbeddingClient.GenerateEmbeddings()` — default model `text-embedding-ada-002`
3. In-memory cache keyed on (text, model) to avoid duplicate calls
4. Output: `float[][]` — one `float[1536]` vector per chunk

#### 4d. Response

Returns `ChunkFrag[]` where each entry is:
```csharp
record ChunkFrag(string Chunk, float[] Embedding)
```

---

### 5. Build ResearchIndex Records

`IndexingService` maps `ChunkFrag[]` → `ResearchIndex[]`:

```
ChunkId      = "{Id}-{chunkIndex:X4}"   e.g. "a3f2...guid...-0001"
Content      = chunkFrag.Chunk
ContentVector = chunkFrag.Embedding.ToList()   // float[1536]
```

Plus shared fields from the caller:

| Field | Source |
|---|---|
| `Id` | Document/note/attachment GUID |
| `Name` | filename or note subject |
| `EntryType` | Note / Attachment / Document |
| `ExtendedNoteType` | derived from NoteType.Description (opsDil, opsFin, legal, etc.) |
| `AsOfDate` | note or document date |
| `ContentType` | html / pdf / docx / mp3 / etc. |
| `NoteType` | `{Id, Description}` from ResearchNote.Type |
| `Links` | linked entity names (fund, firm) |
| `ParentId` | for attachments: parent note GUID |
| `FolderPath` | document folder path (Documents tree) |
| `Metadata` | pageCount, quality, indexedTimestamp, + extraction metadata |
| `IsTable` | `Content.StartsWith("[Table]")` |
| `IsFootnote` | `Content.StartsWith("[Footnote]")` |
| `ExtendedKeywords` | comma-joined distinct linked entity names |

---

### 6. Dual-Write to Azure AI Search

`IndexChunksAsync()` writes all chunks in one batch to **both** search clients:

- **Primary** (East): mandatory — exception thrown on failure
- **Secondary** (West): best-effort — failure logged as warning, not rethrown

Write type: `IndexDocumentsAction.Upload` (upsert semantics).

---

### 7. Write to Blob Cache

After successful indexing:
```
Container : research-index-cache-14
Blob name : {id}.bin
Content   : GZip(JSON(ResearchIndex[]))
Metadata  : sanitized key-value pairs from shared.Meta
```

Cache is keyed by document `Id` (not `ChunkId`). All chunks for one document are stored as a single blob.

---

## Delete Path

`SweepDeletedAsync` runs as part of `DocumentSweepMode.Deleted` or `All`:

1. `GetAllBlobFilenamesAsync()` — list all `.bin` blobs in `research-index-cache-14` → extract GUIDs
2. Query SQL DB for all known document IDs
3. IDs in blob cache but not in DB = orphans
4. `HardDeleteAsync(orphanIds)` — removes from both search clients

Soft-delete also available: sets `EntryType = "Note, Deleted"` (merge operation, no record removal).

---

## Artifact Locations Summary

| Artifact | Location | Format | Key |
|---|---|---|---|
| Pre-computed chunk embeddings | Azure Blob `research-index-cache-14` | GZip JSON | `{Id}.bin` |
| Searchable chunk index | Azure AI Search (Primary) | Index documents | `ChunkId = {Id}-{i:X4}` |
| Geo-redundant replica | Azure AI Search (Secondary) | Same | Same |
| Raw file bytes | SQL DB (`ResearchAttachment.Data`, `RawData`) | Binary | GUID |
| Sweep watermark | `BlobSweepStateTracker` or `FileSystemSweepStateTracker` | JSON | N/A |

---

## Key Interfaces (SK migration targets)

| Current | Role | SK replacement |
|---|---|---|
| `IChunkingStrategy` | split text into chunks | `TextChunker` / `ITextSplitter` |
| `IVectorizationService` | generate embeddings | `ITextEmbeddingGenerationService` |
| `ChunkFrag` record | chunk + vector data contract | `VectorStoreRecord` |
| `SearchClient` (×2) | write/read AI Search | `IVectorStore` (`AzureAISearchVectorStore`) |
| `ResearchIndexBlobCache` | pre-computed embedding cache | no SK equivalent — keep as-is |

---

## Repos Involved

| Repo | Project | Role |
|---|---|---|
| `Crimson.Legacy` | `HMC.ResearchManagement.Service` | sweep scheduler, command handlers, loads content from SQL DB |
| `Shared` | `HMC.Shared.ResearchManagementIndex` | `IndexingService`, `ResearchIndexBlobCache`, `ResearchIndex` model, Azure AI Search write |
| `Shared` | `HMC.Shared.ChatAiClient` | HTTP client to ChatAI; `IDocument`, `ChunkFrag` |
| `CoreServices` | `HMC.ChatAI.Service` | extraction, chunking, vectorization pipeline |

---

## Appendix: Supported Indexing Routes

The topology above is the canonical architecture. This appendix is a compact HTTP route reference derived from the Swagger surface. It is intentionally organized by resource and operating concern rather than by controller order.

### Resource Map

| Resource / concern | Route family | Use |
|---|---|---|
| **Notes** | `/api/v1/Indexing/Notes/...`, `/api/v1/Indexing/{entryType}` | Index one note, many notes, or mixed note/attachment/document payloads. |
| **Attachments** | `/api/v1/Indexing/Attachments/...`, `/api/v1/Indexing/{entryType}` | Index attachment binaries from Research Management. |
| **Documents** | `/api/v1/Indexing/Documents/...`, `/api/v1/Indexing/Sweep/...` | Index document-management files and run document sweeps. |
| **Firms** | `/api/v1/Indexing/Firms/...` | Index missing notes, attachments, and documents beneath firm-linked entities. |
| **Manifest / reconciliation** | `/api/v1/Indexing/Manifest...`, `/api/v1/Indexing/Ids...`, `/api/v1/Indexing/CrossReference...` | Generate manifests, compare index membership, import missing entries. |
| **Search-selected repair** | `/api/v1/Indexing/Search...` | Select index records by Azure AI Search filter, then repair or delete that set. |
| **Operational status** | `/api/v1/Indexing/Status`, `/Monitoring`, `/Performance/Tracking`, `/Count`, `/Settings` | Inspect queues, monitoring state, performance counters, index count, and runtime settings. |
| **Cache / recovery** | `/api/v1/Indexing/ReloadFromCache` | Rehydrate Azure AI Search from the blob cache without re-calling ChatAI. |

### Direct Indexing Routes

| Route | Use |
|---|---|
| `POST /api/v1/Indexing/Notes/{noteId}/Index` | Index one note. Does not start monitoring. Can include or skip child attachments. |
| `POST /api/v1/Indexing/Attachments/{attachmentId}/Index` | Index one attachment. Does not start monitoring. |
| `POST /api/v1/Indexing/Documents/{documentId}/Index` | Index one document. Does not start monitoring. |
| `PATCH /api/v1/Indexing/{entryType}/{id}` | Generic single-entry indexing route for a note, attachment, or document. |
| `PATCH /api/v1/Indexing/{entryType}` | Index many identifiers of the same entry type. Starts monitoring if not already started. |
| `PATCH /api/v1/Indexing` | Bulk mixed indexing payload using `{ type, id }` entries. Useful for repair workflows. |

### Firm-Scoped Indexing Routes

| Route | Use |
|---|---|
| `POST /api/v1/Indexing/Firms` | Index many firms. Always pushes work to the bus. |
| `POST /api/v1/Indexing/Firms/{firmId}` | Index missing notes, attachments, and documents for one firm. |
| `POST /api/v1/Indexing/Firms/{firmId}/Notes` | Index missing notes for one firm. Starts monitoring if needed. |
| `POST /api/v1/Indexing/Firms/{firmId}/Documents` | Index documents for one firm, optionally filtered by `searchTerm`. Starts monitoring if needed. |
| `GET /api/v1/Indexing/Firms/{firmId}/Manifest` | Export a CSV manifest for one firm's indexed entities. |

### Search, Repair, and Delete Routes

| Route | Use |
|---|---|
| `POST /api/v1/Indexing/Search` | Run an Azure AI Search filter and return simplified entries suitable for bulk indexing. |
| `PATCH /api/v1/Indexing/Search/Repair` | Search, then force-reload the matching subset. Supports `dryRun` before repair. |
| `DELETE /api/v1/Indexing/Search/Delete` | Search, then delete the matching subset. Supports `dryRun` and `hardDelete`. |
| `DELETE /api/v1/Indexing/{indexEntryId}` | Delete one index entry by identifier. Supports bus dispatch and hard-delete behavior. |
| `DELETE /api/v1/Indexing` | Delete many index entries by identifier. Supports bus dispatch and hard-delete behavior. |

### Manifest and Reconciliation Routes

| Route | Use |
|---|---|
| `GET /api/v1/Indexing/Ids/DocMgmt` | Export IDs for everything in document management that could or should be indexed. |
| `POST /api/v1/Indexing/Ids` | List identifiers currently present in the index, filtered by entry type. |
| `POST /api/v1/Indexing/CrossReference/Upload` | Upload GUIDs and cross-reference index presence against DocMgmt database presence. |
| `POST /api/v1/Indexing/Manifest` | Generate a CSV manifest of indexed notes, attachments, and documents for specified firms. |
| `POST /api/v1/Indexing/Manifest/Import` | Import a CSV manifest and enqueue missing entities for indexing. |

### Sweep, Cache, and Recovery Routes

| Route | Use |
|---|---|
| `POST /api/v1/Indexing/Documents/Index/Sweep` | Run the document indexing sweep. |
| `POST /api/v1/Indexing/Sweep/{mode}` | Run an indexing sweep by mode. Supports created/updated sweep and deleted sweep behavior. |
| `PATCH /api/v1/Indexing/ReloadFromCache` | Reload Azure AI Search from cached `ResearchIndex[]` blobs. Requires confirmation. |

### Operational and Diagnostic Routes

| Route | Use |
|---|---|
| `GET /api/v1/Indexing/{Id}` | Fetch index entries for one identifier. Useful for direct inspection. |
| `GET /api/v1/Indexing/Status` | Inspect queue status for indexing operations. |
| `POST /api/v1/Indexing/Monitoring` | Start monitoring and reset performance tracking. |
| `GET /api/v1/Indexing/Monitoring` | Check whether monitoring is active. |
| `DELETE /api/v1/Indexing/Monitoring` | Stop monitoring. |
| `GET /api/v1/Indexing/Performance/Tracking` | Read current indexing performance metrics. |
| `DELETE /api/v1/Indexing/Performance/Tracking` | Reset indexing performance metrics. |
| `GET /api/v1/Indexing/Count` | Return current document count in the index. |
| `GET /api/v1/Indexing/Settings` | Return current indexing service settings. |

### Common Route Switches

| Switch | Meaning |
|---|---|
| `force` | Ignore existing cache/index state and re-index. In cache-backed flows this rewrites cache and index output. |
| `fireAndForget` | Dispatch work asynchronously through the bus and return immediately. |
| `quality` | Override document analysis quality, generally `low`, `medium`, `high`, or `variable`. |
| `hardDelete` | Physically remove records instead of soft-marking them as deleted. |
| `dryRun` | Return the impacted records without mutating the index. Used by repair/delete workflows. |
| `filter` | Azure AI Search filter expression used to select the affected subset. |
| `mode` | Sweep mode for created/updated versus deleted document behavior. |

### Route Shape Notes

Some route templates intentionally overlap and are disambiguated by HTTP method and route constraints. For example, `GET /api/v1/Indexing/{Id}` reads an entry, while `DELETE /api/v1/Indexing/{indexEntryId}` deletes an entry. Client code and generated SDKs should treat method + path as the unique operation key, not path alone.


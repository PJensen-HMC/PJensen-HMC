# Index Reconciliation — Technical Design

**Component:** `HMC.Shared.ResearchManagementIndex`
**Author:** Pete Jensen
**Date:** 2026-04-20
**Status:** Part 1 complete and verified; Part 2 implemented

---

## Problem

Primary (East) and Secondary (West) Azure AI Search indexes are maintained via dual-write.
Over time, transient failures can cause divergence. This tool identifies documents present
in one index but absent from the other, operating at the document `Id` grain.

---

## Hard Constraints

| Constraint | Detail |
|---|---|
| **AsOfDate is abandoned** | Production geometry is too dense. Single date values can exceed 100K chunks. Cannot be used as a partition key. |
| **ChunkId is unusable** | Schema issue (not expected to be fixed) makes ChunkId unreliable as a reconciliation or partition key. |
| **`Id` is the anchor** | `Id` (document-level GUID shared across all chunks via `ResearchIndexSharedFields.Id`) is the only reliable reconciliation key. All logic operates at the `Id` grain. |
| **100K chunk ceiling per fetch** | Azure AI Search limit. Each fetch (filter expression) must return ≤ 100K documents. |
| **Full Id enumeration is not viable** | Azure AI Search `$skip` caps at 100K. Cannot page through the full index to collect all Ids. |

---

## Rejected Approaches

- **Date bucketing** — crushed by production geometry (prior approach, failed).
- **Two-regime split** (lexical for random GUIDs, bin-pack for sequential) — unnecessary complexity.
- **Bin-pack with pre-enumeration** — blocked by the `$skip` cap; getting all Ids up-front is not feasible.

---

## Finalized Strategy — Adaptive Lexical Prefix (Single Regime)

No pre-enumeration. No Id lists. Only count queries (`$top=0`, very cheap) to build the plan.

### Part 1 — Query Plan Generation (`IndexQueryPlanner`)

1. Start with 16 depth-1 hex prefix buckets covering the full `Id` space:
   `Id ge '0' and Id lt '1'`, ..., `Id ge 'f'`
2. Issue a count query per bucket: `$filter=<range>&$count=true&$top=0`
3. Any bucket with count > target (default 80K) → subdivide into 16 depth-2 children, recurse
4. Repeat until every leaf bucket is within the target
5. Leaf filter expressions = the query plan

**Why this works for both GUID types:**

- **v4 random GUIDs** (Notes, Attachments): uniformly distributed — depth-1 or depth-2 is usually sufficient.
- **Sequential GUIDs** (Documents, SQL FileTable `NEWSEQUENTIALID()`): the sequence walks the first byte,
  so Documents cluster in `6x`–`8x` hex prefixes. Recursive subdivision goes deeper there naturally —
  no special-casing required. Adjacent sequential IDs (e.g. `864ED3CE` → `874ED3CE`) land in the
  same or adjacent depth-3 bucket; no document can slip between fetch boundaries.

**Sampling note (2026-04-20):** ~180 Document GUIDs sampled from production. First-byte distribution
confirmed clustering in the `6`–`8` era, sparse elsewhere.

### Part 1 — Verified Results (2026-04-20)

| Metric | Value |
|---|---|
| Leaf buckets (fetches) | 3,721 |
| Total chunks | 22,176,227 |
| Runtime | ~1.7 min (count-only queries) |
| Distribution | Mostly depth-3 (2K–12K chunks); some depth-2 (~75K–80K) left as leaves; all under 100K ceiling |

Distribution confirmed flat — **GOOD** signal. Proceeding to Part 2.

### Part 1 — Output Format

Plain text file, one line per leaf bucket:

```
Id ge '3a' and Id lt '3b'                          82,441
Id ge '3b' and Id lt '3c'                          79,103
...
Total: 22,176,227 chunks | 3,721 fetches
```

---

### Part 2 — Fetch and Diff (`IndexReconciler`)

Takes the query plan produced by Part 1. For each bucket:

1. Fires fetch of `Id` field against Primary and Secondary **concurrently** (`Task.WhenAll`)
2. Pages through all results for that bucket (guaranteed ≤ 80K chunks per bucket per index)
3. Accumulates unique `Id` values into a global bag (buckets are disjoint ranges, so no cross-bucket duplicates)

After all buckets complete:

- **Missing from Secondary** = Ids in Primary but not Secondary
- **Extra in Secondary** = Ids in Secondary but not Primary

**Parallelism:** 16 concurrent buckets by default (configurable via `IndexReconcilerOptions.MaxDegreeOfParallelism`).
Each bucket fires two concurrent HTTP requests (Primary + Secondary). Effective ~32 concurrent Azure Search requests.

**Output report** (written to `IndexReconcilerOptions.OutputPath` if set):

```
Index Reconciliation Report
Generated              : 2026-04-21T...
Buckets processed      : 3,721
Primary chunks (plan)  : 22,176,227
Primary unique Ids     : 450,xxx
Secondary unique Ids   : 450,xxx
Missing from Secondary : N
Extra in Secondary     : N

--- Missing from Secondary (N) ---
  <guid>
  ...
```

---

## Implementation

| Type | File | Notes |
|---|---|---|
| `IndexQueryPlanner` | `IndexQueryPlanner.cs` | Part 1 — builds the query plan via recursive count queries |
| `IndexQueryPlan` / `QueryPlanEntry` | `IndexQueryPlan.cs` | Plan output types |
| `IndexQueryPlannerOptions` | `IndexQueryPlannerOptions.cs` | `Target` (default 80K), `OutputPath` |
| `IndexReconciler` | `IndexReconciler.cs` | Part 2 — fetches and diffs at Id grain |
| `IndexReconciliationResult` | `IndexReconciliationResult.cs` | Diff output type |
| `IndexReconcilerOptions` | `IndexReconcilerOptions.cs` | `MaxDegreeOfParallelism` (default 16), `OutputPath` |

**Tests** (`Tests/HMC.Shared.ResearchManagementIndex.Tests/Service/`):

- `IndexQueryPlannerTests.BuildQueryPlan_ProducesEvenDistribution` — verifies plan builds against live Primary
- `IndexReconcilerTests.Reconcile_PrimaryVsSecondary_ReturnsResult` — runs full reconciliation, writes report to `/tmp/index-reconciliation.txt`

Both tests are read-only and hit live Azure AI Search. Expected runtime: ~2 min (plan) + ~5 min (reconcile).

---

## Usage

```csharp
// Build plan (Part 1)
var planner = new IndexQueryPlanner(
    indexingService.PrimarySearchClient,
    new IndexQueryPlannerOptions { OutputPath = "/tmp/plan.txt" });

var plan = await planner.BuildPlanAsync();

// Reconcile (Part 2)
var reconciler = new IndexReconciler(
    indexingService.PrimarySearchClient,
    indexingService.SecondarySearchClient,
    new IndexReconcilerOptions { OutputPath = "/tmp/reconciliation.txt" });

var result = await reconciler.ReconcileAsync(plan);

Console.WriteLine($"Missing from Secondary: {result.MissingFromSecondary.Count}");
Console.WriteLine($"Extra in Secondary:     {result.ExtraInSecondary.Count}");
```

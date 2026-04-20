---
name: Index reconciliation — design constraints and query plan strategy
description: Full design for the index-to-index reconciliation tool — constraints, rejected approaches, and finalized query plan strategy
type: project
originSessionId: 5ac79e83-868e-4121-8f62-01931e684509
---
## Context
Need an index-to-index reconciliation tool (Primary East ↔ Secondary West) for `HMC.Shared.ResearchManagementIndex`. Work is in two parts — Part 1 is the query plan; Part 2 (fetch/diff) proceeds only if the plan looks good.

**Why:** — stated 2026-04-20

---

## Hard Constraints

**Constraint 1 — AsOfDate is abandoned.**
Too dense. Production geometry crushes any date-bucketed approach — single date values exceed 100K chunks. Do not use AsOfDate as a partition key.

**Constraint 2 — ChunkId is unusable.**
Schema issue (not likely to be fixed) makes ChunkId unreliable as a reconciliation or partition key.

**Constraint 3 — `Id` is the anchor.**
`Id` (document-level GUID, shared across all chunks of an entry via `ResearchIndexSharedFields.Id`) is the only reliable reconciliation key. All logic operates at the `Id` grain.

**Constraint 4 — 100K chunk ceiling per fetch.**
Azure Search limit. Each fetch (filter expression) must return ≤ 100K documents.

**Constraint 5 — Full Id enumeration is not viable.**
Azure Search `$skip` caps at 100K. Cannot page through the full index to collect all Ids.

---

## Rejected Approaches

- **Date bucketing** — crushed by production geometry (prior approach, failed)
- **Two-regime split** (lexical for random GUIDs, bin-pack for sequential) — unnecessary complexity
- **Bin-pack with pre-enumeration** — blocked by $skip cap; getting all Ids is not feasible

---

## Finalized Strategy — Adaptive Lexical Prefix (Single Regime)

No pre-enumeration. No Id lists. Only count queries (`$top=0`, very cheap).

### Algorithm (Part 1 — Query Plan Generation)

1. Start with 16 depth-1 hex prefix buckets covering the full Id space:
   `Id ge '0' and Id lt '1'`, `Id ge '1' and Id lt '2'`, ..., `Id ge 'f'`
2. Issue a count query per bucket: `$filter=<range>&$count=true&$top=0`
3. Any bucket with count > 100K → subdivide into 16 depth-2 children, count those
4. Recurse until every leaf bucket has count ≤ 100K
5. Leaf filter expressions = the query plan

### Why this works for both GUID types
- **v4 random GUIDs** (Notes, Attachments): uniformly distributed — depth-1 or depth-2 is usually sufficient
- **Sequential GUIDs** (Documents, SQL FileTable): cluster at a fixed prefix, but recursive subdivision handles this automatically — no special-casing needed, no awareness of GUID type

### Output — Part 1
Plain text file. One line per leaf bucket:
```
Id ge '3a' and Id lt '3b'  →  82,441 chunks
Id ge '3b' and Id lt '3c'  →  79,103 chunks
...
```
Human reviews for roughly flat distribution. If good → proceed to Part 2.

### "GOOD" signal
Roughly uniform chunk counts across all leaf buckets — no hot spots, no near-empty buckets. Flat geometry = plan faithfully tiles the index.

---

## Implementation

- **New isolated class** inside `HMC.Shared.ResearchManagementIndex`
- Uses existing `IndexingService` / `SearchClient` infrastructure
- Self-calibration: sample N Ids to estimate avg chunks/Id (for bin-pack sizing if needed in Part 2)
- Part 2 (not yet designed): uses the query plan to fetch and diff Primary vs Secondary

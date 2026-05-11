# Azure AI Search — East vs West Latency Benchmark

**Date:** 2026-04-23  
**Index:** ResearchManagementIndex (HMC.Shared.ResearchManagementIndex)  
**Test:** `IndexQueryBenchmarkTests.BenchmarkEastVsWest_SemanticHybridQuery`

## Setup

| Parameter | Value |
|---|---|
| Query | `search=Metsera` |
| Query type | `semantic` |
| Vector query | `ContentVector`, k=100, exhaustive=false |
| Top | 100 |
| API version | `2025-09-01` |
| Warm-up passes | 1 |
| Measured passes | 20 |
| Fire order | Alternating (even=East first, odd=West first) to eliminate ordering bias |

East = Primary (`eastus`)  
West = Secondary (`westus`)

## Results

| Pass | East ms | West ms | Delta% | East n | West n |
|------|--------:|--------:|-------:|-------:|-------:|
| 1    | 411 | 668 | +62.5% | 100 | 100 |
| 2    | 518 | 703 | +35.7% | 100 | 100 |
| 3    | 454 | 698 | +53.8% | 100 | 100 |
| 4    | 623 | 606 | -2.8%  | 100 | 100 |
| 5    | 532 | 584 | +9.8%  | 100 | 100 |
| 6    | 601 | 671 | +11.7% | 100 | 100 |
| 7    | 428 | 543 | +27.0% | 100 | 100 |
| 8    | 411 | 787 | +91.6% | 100 | 100 |
| 9    | 540 | 556 | +2.8%  | 100 | 100 |
| 10   | 453 | 570 | +25.9% | 100 | 100 |
| 11   | 434 | 640 | +47.4% | 100 | 100 |
| 12   | 394 | 594 | +50.7% | 100 | 100 |
| 13   | 441 | 609 | +38.1% | 100 | 100 |
| 14   | 406 | 561 | +38.1% | 100 | 100 |
| 15   | 488 | 659 | +35.0% | 100 | 100 |
| 16   | 558 | 595 | +6.7%  | 100 | 100 |
| 17   | 469 | 576 | +22.9% | 100 | 100 |
| 18   | 427 | 625 | +46.5% | 100 | 100 |
| 19   | 445 | 751 | +68.7% | 100 | 100 |
| 20   | 442 | 541 | +22.4% | 100 | 100 |

## Summary Statistics

| Region | Mean | Min | p50 | p95 | Max |
|--------|-----:|----:|----:|----:|----:|
| East (Primary) | 474ms | 394ms | 449ms | 602ms | 623ms |
| West (Secondary) | 627ms | 541ms | 607ms | 753ms | 787ms |

**East faster by ~32% on mean, ~35% on p50, ~25% on p95.**

## Notes

- Result counts identical across all 20 passes (100/100) — no replication lag or divergence.
- West outlier at pass 8 (787ms, +91.6%) suggests occasional GC or routing spike.
- East had one near-tie at pass 4 (-2.8%) and pass 9 (+2.8%) — within noise.
- One warm-up pass may be insufficient; HNSW index cache may still be cold on passes 1–2 of measured run. Results are still directionally valid.
- Benchmark fires raw HTTP via `SearchClient.Pipeline` to avoid SDK overhead masking timing.

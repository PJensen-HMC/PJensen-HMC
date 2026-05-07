# Manifest

Current raw evidence inventory:

| Area | Count | Location | Notes |
| --- | ---: | --- | --- |
| Chat exports | 3 | `01_raw-evidence/chat/` | Printed GPT conversations, including the slides-related export. |
| Notes | 4 | `01_raw-evidence/notes/` | Day-level raw notes, extended Day 2 GPT capture, and canonical schedule export. |
| Audio transcripts | 8 | `01_raw-evidence/audio-transcripts/` | Raw transcript captures, not cleaned. |
| Images | 45 | `01_raw-evidence/images/` | Timestamped images and one ChatGPT screenshot. |
| Image OCR ledgers | 1 | `01_raw-evidence/images/images-ocr.md` | OCR extraction ledger keyed by image filename; uncertainty and signal notes preserved. |
| Booth notes | 6 | `01_raw-evidence/booth-notes/` | Vendor and exhibit-hall notes. |

Primary normalized indexes:

| Index | Purpose |
| --- | --- |
| `02_normalized/source-ledger.md` | Spine for all sources and downstream use. |
| `02_normalized/image-index.md` | Image inventory keyed by timestamp/source id. |
| `02_normalized/audio-index.md` | Transcript inventory keyed by timestamp/source id. |
| `02_normalized/booth-index.md` | Booth/vendor note inventory. |
| `02_normalized/day1-timeline.md` | Day 1 source chronology. |
| `02_normalized/day2-timeline.md` | Day 2 source chronology. |

Primary extracted claim files:

| File | Purpose |
| --- | --- |
| `03_extracted-claims/day1-claims.md` | Day 1 source-level claims and field observations. |
| `03_extracted-claims/day2-claims.md` | Day 2 source-level claims and field observations. |
| `03_extracted-claims/vendor-claims.md` | Booth and vendor/hallway claims. |
| `03_extracted-claims/slide-claims.md` | Image-derived claims promoted from `01_raw-evidence/images/images-ocr.md`. |

Primary analysis files:

| File | Purpose |
| --- | --- |
| `04_analysis/day1-synthesis.md` | Day 1 interpretation grounded in extracted claim IDs. |
| `04_analysis/day2-synthesis.md` | Day 2 interpretation grounded in extracted claim IDs and OCR-backed slide claims. |

Primary output files:

| File | Purpose |
| --- | --- |
| `05_outputs/agent-conference-2026.md` | Claim-backed internal memo synthesizing the conference into HMC architecture implications. |

Primary distillation files:

| File | Purpose |
| --- | --- |
| `06_everything/agent-conference-2026-everything.md` | Everything together, companies, people, takeaways. |
| `06_everything/README.md` | Stage guide for the executive distillation layer. |

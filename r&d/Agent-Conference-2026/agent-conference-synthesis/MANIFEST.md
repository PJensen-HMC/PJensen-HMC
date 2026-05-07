# Manifest

Current raw evidence inventory:

| Area | Count | Location | Notes |
| --- | ---: | --- | --- |
| Chat exports | 3 | `01_raw-evidence/chat/` | Printed GPT conversations, including the slides-related export. |
| Notes | 4 | `01_raw-evidence/notes/` | Day-level raw notes, extended Day 2 GPT capture, and canonical schedule export. |
| Audio transcripts | 8 | `01_raw-evidence/audio-transcripts/` | Raw transcript captures, not cleaned. |
| Images | 45 | `01_raw-evidence/images/` | Timestamped images and one ChatGPT screenshot. |
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
| `03_extracted-claims/slide-claims.md` | Image-derived claim placeholder; no claims promoted until image review/OCR. |

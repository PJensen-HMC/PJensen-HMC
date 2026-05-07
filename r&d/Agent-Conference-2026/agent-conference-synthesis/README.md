# Agent Conference Synthesis

This workspace is organized as a processing pipeline:

1. `01_raw-evidence`: untouched artifacts, grouped by evidence type.
2. `02_normalized`: indexes, timelines, ledgers, and cleaned references.
3. `03_extracted-claims`: what sources actually say.
4. `04_analysis`: what those claims likely mean.
5. `05_outputs`: memos, deck notes, and final written artifacts.

The working rule is processing state first, source identity second, theme last.

Raw evidence should stay raw. If a source needs interpretation, transcription cleanup, or thematic extraction, that work should happen in a later stage and point back to the original source through `02_normalized/source-ledger.md`.


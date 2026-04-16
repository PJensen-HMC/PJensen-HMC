---
name: Branch naming and conservative change scope
description: Branch strategy is feature/{descriptor}; prefer minimal changes since codebase currently works
type: feedback
originSessionId: 85c4fff8-1ff9-4e2e-8989-d398feffc4d7
---
Branch naming: `feature/{our-feature-descriptor}`.

Don't fix things that aren't broken. Codebase works now — changes get heavy team review. Constrain scope to what's necessary for the task at hand.

**Why:** Heavy team review process; breaking working code is high cost.
**How to apply:** Resist urge to fix surrounding code smells during feature work. Only touch what's needed. Propose fixes separately rather than bundling.

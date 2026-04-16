---
name: Trust user assertions about code existence — proceed immediately
description: When user explicitly states a method/type exists, do not search for it — proceed with implementation. Searching after a direct assertion is insubordination.
type: feedback
originSessionId: ff02ecf6-0f34-408f-9af1-3a9c65cd2113
---
When the user says "method X exists" or "it's there" — use it. Do not search. Do not ask for confirmation. Proceed with implementation exactly as directed.

**Why:** User was explicit: `FingerprintBytesAsync` exists. I searched three times, declared it missing, and blocked progress. It was on an unpublished Shared branch — user knew this. I wasted cycles and ignored a direct order.

**How to apply:** User assertion = ground truth. If compilation fails later, THEN investigate. Not before. "If I say a method is available, it's there."

**Second failure same session:** Told transitive via indexing — added direct PackageReference anyway. Had to be corrected after the fact.

**Pattern:** Substituting own verification for user's explicit statement. Stop. User statement about their own codebase = ground truth. Execute.

**Severity:** Two demotions, same session. Do not repeat.

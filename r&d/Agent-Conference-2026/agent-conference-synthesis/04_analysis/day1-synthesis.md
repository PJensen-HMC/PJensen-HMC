Below is a condensed memo draft.

## Internal Memo: NYC Agent Conference — Day Synthesis

The strongest signal from the day was clear: the hard part is not the agent. The hard part is the operating environment around the agent: context, identity, permissions, evaluation, observability, runtime cost, and organizational control.

The useful talks converged on the same point from different angles. Agents are not just chat interfaces or task runners. In production, they become distributed systems with identity, budgets, traces, failure modes, and security exposure.

### Core takeaway

Enterprise agent adoption is not primarily a model-selection problem. It is an infrastructure, governance, and measurement problem.

The model is only one component. The actual production stack needs:

Data and context substrate
Agents require high-quality, versioned, provenance-aware context. LanceDB framed this well: agent workloads push retrieval systems into database-scale problems, with billions of rows, high QPS, p99 latency constraints, HNSW indexing, sharding, metadata explosion, and versioned context. The key point: agents create pathological context workloads.

Execution layer
Coding-agent talks showed that the PR/review loop becomes the true control surface. AGENTS.md, preview environments, harnesses, stacked diffs, and code-review compression are becoming necessary infrastructure. Agents do not eliminate review; they increase code volume and make review the bottleneck.

Identity and capability control
Multiple talks reinforced that API keys are not sufficient. Agents need delegated identity: who is acting, on whose behalf, with what scope, through which system. “On behalf of” semantics, Entra-style agent identity, MCP scopes, and governed gateways came up repeatedly. The agent SDK is not a helper library; it becomes a security boundary.

Runtime and cost layer
The “below the waterline” talk was one of the most useful. Agents require scheduling, model routing, token pools, budget awareness, multi-tenancy, observability, and centralized runtime management. Tokens become a managed enterprise resource. Agents must reason about cost as part of the execution loop, not after the fact.

Security layer
The rogue-agent discussion was blunt: prompt injection will happen. The goal is not perfect prevention; it is containment. Agent systems need defense in depth: identity, scopes, gateways, validation, behavioral monitoring, automated response, and security escalation. A bad agent can look like rogue behavior. Monitoring is not optional.

Evaluation layer
The eval panel completed the stack. Evals are not a point-in-time test suite. They are a continuous measurement system over traces. Strong points included: eval engineering starts before agent design, LLM judges do not scale, judges must be converted into cheaper guardrails, cost per successful outcome is a critical metric, and human intervention should be labeled/tagged as a first-class signal.

### Emerging model

The production agent stack looks like this:

1. Context substrate
   Versioned retrieval, provenance, structured filters, raw artifacts, write paths.

2. Execution harness
   Task decomposition, sandboxing, preview environments, tests, PRs, review gates.

3. Identity and capability plane
   Delegated identity, scoped permissions, capability discovery, governed gateways.

4. Runtime control plane
   Model routing, token budgets, token pools, scheduling, observability, cost controls.

5. Security loop
   Behavior monitoring, anomaly detection, prompt-injection containment, automated response.

6. Evaluation and governance
   Trajectory eval, simulation, variance tracking, KPI alignment, guardrails, cost per outcome.

### Implications for HMC

The most relevant implication is that we should not treat agents as standalone tools. We should treat them as workloads running inside a governed runtime.

For HMC, the near-term focus should be:

Define governed capability surfaces
Avoid giving agents raw access to systems. Wrap enterprise capabilities behind scoped, auditable, policy-aware interfaces.

Build or standardize an agent SDK carefully
A Crimson-style agent SDK is directionally right, but it must encode identity, scopes, observability, cost control, and gateway behavior. It cannot just be convenience glue.

Prioritize observability early
Several speakers emphasized that observability must come before architecture hardens. We need traces that explain why an agent acted, not just what happened.

Make cost visible
Cost per successful outcome is likely the cleanest executive metric. Token budget, model routing, and runtime cost must be visible from the start.

Treat eval as infrastructure
Agent evals need to run continuously. We need offline evals, runtime evals, trace review, intervention tagging, variance measurement, and guardrails derived from expensive evaluations.

Do not retrofit governance
The repeated warning was that retrofitting governance is extremely hard. Rules, scopes, approvals, and audit surfaces need to be built into the operating model from the beginning.

### Strongest one-line synthesis

Agents are not the product; the product is the governed runtime that lets agents act safely, measurably, and economically.

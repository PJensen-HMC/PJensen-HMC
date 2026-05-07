# Internal Memo v1.0

# NYC Agent Conference — Production Agent Architecture, Control Planes, and HMC Implications

**Audience:** AI team / engineering leadership
**Purpose:** Internal synthesis from Day 1 + Day 2 conference capture, slide OCR, audio transcripts, booth notes, and live synthesis
**Status:** Internal working memo; suitable as deck substrate after final verification of quoted numbers

---

## Executive Summary

The strongest conclusion from the conference is that production agents are not primarily a model-selection problem. They are an enterprise control-plane problem.

Across the serious talks, panels, booth conversations, and slide captures, the same architecture kept reappearing: schema, identity, governed capability surfaces, context engineering, evals, observability, data lineage, deterministic execution boundaries, replayable environments, cost controls, and human verification. The model was no longer the center of gravity. The substrate around the model was.

The conference was useful less because any single vendor had the answer and more because unrelated speakers converged on the same missing enterprise layer. Apollo validated schema-mediated API surfaces. NVIDIA validated CLI-style workflows, gates, and sweeps over governed substrate. Bauplan validated safe failure surfaces for data agents. Monte Carlo validated data-to-agent observability. CircleCI / OpenAI / Databricks validated that generation velocity is outpacing validation capacity. The MCP panel exposed the ugly side of unmanaged tool exposure. RingCentral gave the clearest rule for where agents belong: use agents for ambiguity, research, and hypothesis generation; keep known-procedure execution deterministic.

For HMC, the implication is not “adopt agents broadly.” The implication is: build the governed operating substrate that allows agents to act safely, measurably, and economically.

The most important internal line:

> Agents should not receive raw access to enterprise systems. They should operate through mediated, schema-aware, identity-bound, auditable capabilities.

That is the core architecture.

---

## Method Note: Why This Synthesis Is Credible

This was not normal conference attendance or vendor networking. The capture method was explicitly designed to filter for architecture, not slogans.

The Day 1 operating mode was to classify each talk quickly: real system versus narrative, topology versus vibes, constraints versus capabilities, failure modes versus success theater, builders versus vendors. Talks were evaluated for architecture shape, explicit constraints, real eval method, and admitted failure. Talks without concrete topology, constraints, evals, or scars were treated as low signal.

The field card was blunt: sample hard, move clean, compress immediately. Capture format was claim, system, constraint, eval, verdict. The mission was to leave with three real patterns, two missing pieces, and one sharp take.

That matters. This memo is not a general-purpose conference recap. It is a filtered map of what survived scrutiny.

The Day 2 notes make this explicit: the day functioned as a live scanner for whether the industry is converging on the same architecture we have already been circling internally: mediated systems, schema, identity, deterministic execution, evals, observability, data lineage, replay, and controlled blast radius.

---

## Core Thesis

The conference confirmed that enterprise agents require a governed substrate.

A production agent system is not:

* a chatbot
* a workflow builder
* a model wrapper
* a pile of tools
* an MCP server catalog
* a prompt chained to APIs

A production agent system is closer to:

* identity-bound actor
* scoped capabilities
* governed context
* deterministic handoff boundaries
* eval / replay
* observability
* cost and runtime controls
* audit and incident response

The clearest phrasing:

> Agents are not the product. The product is the governed runtime that lets agents act safely, measurably, and economically.

---

## 1. The Agent Layer Is Really a Mediated Capability Layer

The strongest proprietary implication is the `env.API` / governed capability-surface thesis.

The bad pattern is obvious:

* Agent gets a large bag of tools.
* Agent gets broad endpoint access.
* Agent receives ambiguous permissions.
* Agent decides what matters.
* Audit is bolted on later.

The better pattern:

* Enterprise systems stay behind a mediated layer.
* Capabilities are schema-normalized.
* Identity is explicit.
* Actions are constrained.
* Reads and writes are separated.
* Calls are logged and replayable.
* Blast radius is deliberate.

This is not integration plumbing. It is the agent safety boundary.

### Apollo as Validation

Apollo was one of the cleanest booth validations. The booth capture described Apollo as using GraphQL to unify APIs, with a control layer, Docker/appliance-style packaging, and a GitHub artifact to inspect later.

The Day 2 raw notes sharpened this further: Apollo ingests Swagger/OpenAPI files, wraps existing APIs, applies schema and identity, and avoids offering agents piles of raw tools and endpoints. The key recognition was mutual: enterprises cannot just expose endpoint sprawl and call that agent-readiness.

This maps directly to `env.API`.

The important correction is that GraphQL should be called out explicitly. GraphQL is not magic, but it is a plausible mediation mechanism: it forces a typed, queryable, schema-aware surface across messy underlying services. In the agent context, that matters because the agent should not discover the enterprise through raw endpoints. It should operate through a curated capability graph.

Internal line:

> The API layer only becomes the agent layer when it stops being an endpoint dump and becomes a governed capability surface: typed schema, identity, runtime isolation, policy, observability, and replay.

Crimson-style implication:

> `env.API` should be treated as a first-class product surface, not a proxy. It is where semantics, authorization, audit, action policy, and non-human actors meet.

---

## 2. CLI Tools Over Governed Substrate Are a Serious Pattern

NVIDIA’s talk should be elevated in the memo. The useful story was not “NVIDIA uses AI.” The useful story was that once coding harnesses and CLIs spread internally, velocity increased, and validation became the constraint.

The key pattern was:

* research
* gates
* sweeps

Research means using agents to map the system, inspect history, find seams, generate diagrams, and understand topology before changing code.

Gates mean blocking rot from entering production: layered PR checks, fast feedback, intelligent test selection, behavioral verification in real containers, drift checks, conflict checks, security checks, architecture alignment, and coverage checks.

Sweeps mean cleaning what gates cannot see: nightly or repeated checks, recurring review-pattern detection, and standards tightening over time.

This is one of the most useful engineering-practice takeaways.

The value is not chat. The value is commandable infrastructure.

CLI-style tools around a governed substrate give both humans and agents a shared operating surface: explicit operations, reproducible runs, validation gates, logs, repeatability, and controlled execution. That is much more useful to internal platform work than generic agent UIs.

Internal line:

> CLI and GraphQL point toward governed operating surfaces. MCP sprawl points toward unmanaged capability exposure.

---

## 3. MCP Is Useful, but MCP Sprawl Is an Anti-Pattern

MCP is clearly important. It gives agents a way to discover and call tools. But the conference also showed why MCP can go wrong quickly.

The Day 1 notes described MCP/tool gateways as mandatory: schema and resource-aware tools, detection/response, blocked unsafe actions, traceability, scope correctness, incident response time, and kill switches. The anchor was clear: agents should not call tools directly; they should pass through a governed gateway.

The MCP panel was useful because it exposed the failure mode: MCP auth, tool explosion, data leakage, service-account confusion, user-vs-agent ambiguity, and audit problems. The Day 2 notes specifically call out Arcade / HubSpot / PagerDuty / Groupon as surfacing these issues.

HubSpot’s reported thousands of MCP servers/tools should be treated as the negative case. A huge inventory of MCP surfaces is not evidence of maturity. It may simply be endpoint sprawl in a new costume.

Professional framing:

> A large MCP catalog without identity, scopes, gateway policy, audit, tool hygiene, action-specific controls, and kill switches is not a control plane. It is a blast-radius multiplier.

Internal line:

> MCP servers are not governance. MCP is a connection pattern. Governance lives in identity, policy, scopes, audit, mediation, and runtime enforcement.

---

## 4. Identity and Delegated Authority Are First-Order Architecture Problems

The conference repeatedly reinforced that API keys are not sufficient. Agents need delegated identity: who is acting, on whose behalf, with what scope, through which system, under which policy, and with what audit trail.

The Day 1 memo captured the key point: the agent SDK is not a helper library; it becomes a security boundary. Identity, scopes, observability, cost control, and gateway behavior must be encoded into the operating model from the beginning.

The rogue-agent notes made the same point operationally. Standard traces, standard scopes, standard delegation, and consumable audit surfaces matter because security friction causes teams to bypass controls. Raw logs are not usable audit. Security and developer tooling need to share a runtime view of what happened.

This leads to a concrete internal requirement.

Every agent action should be attributable across at least four dimensions:

* **Subject:** the user or business principal on whose behalf the action occurred
* **Actor:** the agent/runtime that executed the action
* **Capability:** the specific mediated operation invoked
* **Authority:** the intersected permission set that allowed the operation

Without this, we will not be able to distinguish a user action from an agent action, an intended operation from a drifted operation, or a valid delegated action from a privilege leak.

---

## 5. Data Safety Is the Hardest Version of Agent Safety

Bauplan was one of the most important talks because it made the data problem concrete.

People are becoming increasingly comfortable letting agents write code because software development already has safe failure surfaces: Git, branches, diffs, pull requests, tests, review, and rollback. Data workflows are different. A bad data mutation can corrupt tables, break pipelines, create inconsistent state, burn expensive runtime, or silently damage downstream workflows.

The Day 2 memo captured the clean line:

> Code can fail locally. Data fails socially.

That line should stay.

The data world needs equivalent safe-failure primitives:

* branches
* snapshots
* dry runs
* statistical checks
* lineage
* review
* conflict handling
* rollback
* sandbox state
* preflight validation
* staged promotion

The internal implication is direct:

> Agents should not mutate authoritative business data directly. Any write path needs mediation, preflight, review, audit, rollback, and ideally synthetic or sandbox state before real systems are touched.

This is especially important for HMC. Agentic data workflows will be attractive because they promise leverage over analysis, data discovery, pipeline repair, data-quality investigation, and research operations. But the failure mode is much worse than a bad draft or a broken local build.

Internal line:

> The right near-term posture is agent-as-proposer, deterministic-system-as-executor.

---

## 6. The Bottleneck Has Moved from Generation to Validation

This was one of the most repeated signals across both days.

The slide OCR captured it cleanly: the bottleneck migrated from code generation to code validation. AI accelerates the inner loop: high-volume patches, AI-generated code, debug, build. But the outer loop becomes the constraint: tests, deploy queues, manual review, compliance, security, slow feedback, and noisy signals.

NVIDIA’s gates/sweeps framing reached the same conclusion from engineering practice. CircleCI / OpenAI / Databricks reached it from software-delivery data. Bauplan reached it from data safety. Monte Carlo reached it from trust and observability.

This is a fundamental shift.

The scarce resource is no longer code production. It is verification capacity.

Implications:

* Review becomes the bottleneck.
* CI/CD becomes load-bearing agent infrastructure.
* Security review must become more automated and more contextual.
* Evals need to move earlier and run continuously.
* Trace quality becomes a production concern.
* Human intervention must be tracked as a first-class signal.
* Accepted outcomes matter more than generated artifacts.

The conference also surfaced a perception gap: subjective acceleration can diverge sharply from measured throughput. One slide cited a 39-point speed-perception gap between felt speed and measured speed. That specific number should be verified before leadership presentation, but the underlying point is important: “feels faster” is not an engineering metric.

Internal metric direction:

> Do not measure “agent usage.” Measure accepted outcomes.

Examples:

* time from issue to accepted PR
* review burden
* test failure rate
* pipeline failure rate
* rework rate
* production incident rate
* time to recover
* cost per successful outcome
* human intervention rate
* trace completeness
* policy violation rate
* rollback frequency

---

## 7. Evals Are Infrastructure, Not a Test Suite

The Day 1 eval synthesis is one of the strongest architecture fragments.

The captured model:

* evals run before, during, and after execution
* offline evals support design
* runtime evals observe real behavior
* LLM judges are expensive and rich
* judges should be distilled into cheaper guardrails
* SLMs / single-token classifiers can become cheap in-loop checks
* evals integrate with observability, KPI tracking, identity, and governance
* cost per successful outcome is the primary executive metric
* trajectory quality matters more than final answer alone
* variance matters
* human takeover/intervention rate matters

The final anchor from the notes is worth preserving:

> An agent system is only as good as its ability to continuously measure, constrain, and correct itself under cost, variance, and real-world feedback.

This should become a core architecture principle.

For HMC, evals should not be bolted on after a demo. They should be part of the system design:

* golden task sets
* synthetic task sets
* regression cases
* trajectory scoring
* tool-call scoring
* retrieval-quality checks
* source-version replay
* cost-per-success tracking
* human intervention labels
* failure taxonomy
* runtime guardrails derived from expensive evals
* approval thresholds by risk class

Internal line:

> If we cannot replay it, score it, and explain it, we should not trust it.

---

## 8. Context Engineering Is Replacing Naïve RAG

The conference repeatedly moved away from “RAG solves it” toward a broader model of governed context.

LanceDB’s strongest slide was not “use a vector database.” It was that a vector database is not enough for agents. Production retrieval needs to answer operational questions: which source version produced the embedding, which index served the eval run, and when derived context became visible.

Day 2 synthesis tied this to Mistral, Cockroach, Monte Carlo, and HMC’s search instincts: curated knowledge domains, source lineage, chunking/embedding/vector-store failure modes, and governed context rather than dumped context.

Monte Carlo made the failure chain especially clear:

source data → chunking → embedding → vector store → retrieval → agent behavior → output trust

The important point: agent failures are often data failures in disguise. Teams may blame prompts or models when the true failure is stale source data, a schema change, broken chunking, retrieval drift, or an embedding/index issue.

Internal requirement:

Every agent answer over internal knowledge should be traceable to:

* source document/data ID
* source version
* retrieval/index version
* embedding model/version
* retrieval query/filters
* chunks returned
* visibility time
* model/tool path
* final answer
* confidence/eval result

Context is not “stuff in the prompt.” Context is governed runtime state.

---

## 9. Observability Must Cross Data, Semantic, Agent, and Trust Layers

The slide OCR captured a useful maturity model with four layers: data layer, semantic layer, agent-build layer, and trust layer. Production-grade maturity means end-to-end lineage from agent output to source, embedding drift monitors, retrieval quality alerts, tool-call traces, behavior anomaly alerts, and unified observability across layers.

This is a strong framework because it prevents the common mistake: treating agent observability as prompt/response logging.

Prompt logs are insufficient.

A production agent observability layer needs:

* data freshness
* data schema drift
* document/source lineage
* embedding/index drift
* retrieval quality
* tool-call traces
* model outputs
* policy decisions
* approval events
* cost/latency
* behavior anomalies
* outcome feedback
* human intervention
* incident correlation

The notes also emphasize that observability must be consumable. Security and developers need readable traces. Raw logs do not create governance. If observability is too hard to use, teams bypass it.

Internal line:

> Agent observability is not “what did the model say?” It is “what happened across data, context, tools, policy, model, user, and outcome?”

---

## 10. Deterministic Boundaries Matter More, Not Less

The RingCentral / “Bright Line” slide was likely the clearest architectural rule in the entire pile.

The slide asks: when do agents earn their complexity cost?

Deterministic systems:

* downloading and normalizing market data
* computing signals from a defined strategy
* executing trades against a rulebook
* order management
* position reconciliation

Agentic systems:

* generating hypotheses for why a strategy is underperforming
* designing and evaluating new trading strategies
* deciding which research direction to pursue
* evaluating whether an edge is decaying or structural

Bottom line from the slide:

> If a task has a known procedure and predictable output, it does not need an agent. It needs a well-engineered pipeline.

The follow-on swarm architecture slide made this concrete: specialized research agents operate above a strategy-deployment boundary; validated strategies cross that line into a deterministic pipeline for data ingestion, signal computation, order management, and trade execution. The bottom layer explicitly says: no agents here; deterministic pipeline.

This is extremely relevant to HMC.

Agents should operate where ambiguity is the work:

* research
* synthesis
* classification
* triage
* proposal generation
* data-quality investigation
* document analysis
* hypothesis generation
* strategy exploration
* codebase understanding
* operational diagnosis

Agents should not be handed direct execution authority where procedure is known and consequences are high:

* trade execution
* reconciliation
* authoritative data mutation
* entitlement changes
* production config changes
* security policy changes
* financial operations
* record-of-truth updates

Internal line:

> Agents belong above the ambiguity boundary. Deterministic systems should retain execution authority.

---

## 11. Infrastructure Pressure Is Under-Discussed and Likely Underestimated

Cockroach’s infrastructure warning should stay in the leadership deck. The specific vendor fit may be unclear, but the infrastructure argument is real.

Day 2 synthesis captured the point: agent-driven load is not human-driven load. If the number of actors explodes, systems of record, databases, queues, auth, logging, and CI/CD become compression points.

The raw Cockroach capture also described this as a stateful infrastructure problem: systems of record and the connected tissue around them become bottlenecks under extraordinary elastic scale.

This matters because early prototypes hide the problem. Low-volume agent demos do not reveal what happens when agents:

* run continuously
* retry aggressively
* fan out across tools
* poll systems repeatedly
* generate many intermediate artifacts
* trigger CI repeatedly
* perform large retrieval fanout
* write logs/traces for every step
* call APIs faster than humans
* hold state across long tasks

The infrastructure question is not only token cost. It includes:

* database load
* auth load
* queue load
* logging volume
* trace volume
* retrieval QPS
* index refresh pressure
* CI/CD pressure
* rate limits
* cache invalidation
* workflow retries
* backpressure
* kill switches
* incident blast radius

Internal line:

> Agent adoption is capacity planning.

---

## 12. Small Models Are Back Because Economics Are Back

The Day 2 memo made a useful point: small models and deterministic systems are coming back hard. Mistral’s model-size/right-sizing theme and RingCentral’s deterministic execution boundary point away from one giant reasoning blob and toward heterogeneous architecture: small models, frontier models, deterministic layers, and strict boundaries.

This is important for HMC because it argues for engineering the surface, not simply paying for maximum cognition.

When a task is bounded, the right question is not “what is the smartest model?” The right question is:

> What is the smallest, cheapest, fastest, most controllable model that can reliably perform this bounded job inside a governed workflow?

This reinforces the platform thesis. Better substrate reduces ambiguity. Reduced ambiguity makes smaller/cheaper models viable.

Potential internal split:

* frontier models for ambiguity, synthesis, research, planning
* smaller models for classification, routing, validation, guardrails, extraction
* deterministic services for known execution
* static checks for policy/format/security constraints
* human review for high-consequence judgment

Internal line:

> Model strategy follows substrate quality. Better surfaces reduce the need for brute-force reasoning.

---

## 13. Coding Agents Require a Software-Factory Redesign

Coding agents do not remove software engineering constraints. They amplify the importance of the software factory.

The Day 1 memo captured the core: the PR/review loop becomes the true control surface. AGENTS.md, preview environments, harnesses, stacked diffs, and code-review compression become necessary infrastructure. Agents increase code volume and make review the bottleneck.

NVIDIA’s gates/sweeps framing and CircleCI’s validation-pressure data point in the same direction.

For internal repositories, coding-agent readiness should include:

* clear ownership
* strong tests
* small change units
* stable local execution
* documented architecture constraints
* agent-readable instructions
* explicit forbidden patterns
* good CI feedback
* preview environments
* repeatable review loops
* traceable provenance
* repo history preservation
* migration notes
* decision records

A coding agent in a clean repository is leverage. A coding agent in a messy, undocumented repository is velocity applied to entropy.

Internal line:

> Agents magnify repo quality. They do not replace it.

---

## 14. Security Posture: Treat Agents Like Untrusted Actors

The rogue-identity notes were strong: a bad agent can look like rogue behavior. Monitoring is not optional. Agents can drift, act outside intent, and scale impact. The suggested evaluation dimensions were anomaly detection, false positives/false negatives, time-to-detect, and time-to-stop.

Prompt injection was also framed correctly: the LLM is an untrusted transformer. Inputs can contain instructions. Tool calls can be hijacked by tainted context. Policy needs to sit before and after tool calls.

Practical controls:

* separate instructions from data
* allowlist tools and schemas
* enforce runtime policy at gateway
* validate inputs and outputs
* scope capabilities narrowly
* monitor behavior
* detect anomalies
* rate-limit actions
* require approval for high-risk operations
* record complete traces
* support kill switches
* red-team prompt/tool-call paths
* measure response time

Internal line:

> Security cannot live outside the agent runtime. It must be in-path.

---

## 15. Vendor / Capability Map

This is not a procurement recommendation. It is a capability map from the field scan.

### Apollo

**Signal:** High
**Theme:** GraphQL/API mediation, schema, identity, control layer, deployable wrapper
**Internal relevance:** Validates `env.API` / governed capability surface
**Risk/question:** Need to inspect actual product depth, auth model, observability, policy model, and whether GraphQL unification becomes too permissive
**Evidence summary:** Booth capture described GraphQL API unification, control layer, Docker/appliance packaging. Day 2 notes described Swagger/OpenAPI ingestion, schema, identity, and API wrapping.

### NVIDIA

**Signal:** High
**Theme:** CLI workflows, research/gates/sweeps, validation bottleneck, governed substrate
**Internal relevance:** Validates commandable internal tooling around constrained operations and verification gates
**Risk/question:** Avoid mistaking velocity tooling for governance; gates must be real

### Bauplan

**Signal:** High
**Theme:** Safe agents for data pipelines, branch/review/merge model, safe failure surfaces
**Internal relevance:** Data agents must not mutate authoritative systems directly
**Risk/question:** Whether “Git for data” works at enterprise scale or is a useful metaphor hiding hard infrastructure

### Mistral

**Signal:** Medium-high
**Theme:** Smaller models, model right-sizing, evals, messy enterprise data, harnesses
**Internal relevance:** Encourages heterogeneous model strategy and bounded-task design
**Risk/question:** Exact deployment and governance fit

### CockroachDB

**Signal:** Medium-high for infrastructure thesis; unclear vendor fit
**Theme:** Stateful infrastructure under agent-shaped load
**Internal relevance:** Capacity planning for systems of record, queues, auth, logging, CI/CD, databases
**Risk/question:** Product fit unclear; argument more important than vendor

### Monte Carlo

**Signal:** High
**Theme:** Garbage data → garbage agents; data/AI observability
**Internal relevance:** Agent trust requires lineage from source data through retrieval/tool path to output
**Risk/question:** How much integrates with existing internal observability and data platforms

### CircleCI / OpenAI / Databricks Panel

**Signal:** High
**Theme:** AI software delivery data; modest gains; speed perception gap; validation bottleneck
**Internal relevance:** Measure accepted outcomes, not generated output
**Risk/question:** Verify exact numbers before leadership deck

### MCP Panel / HubSpot / PagerDuty / Groupon / Arcade

**Signal:** High as warning
**Theme:** MCP auth, tool explosion, leakage, user-vs-agent ambiguity
**Internal relevance:** MCP must sit behind governed gateway and identity model
**Risk/question:** Unmanaged MCP server/tool sprawl. HubSpot’s thousands-of-tools pattern should be treated as negative evidence, not maturity.

### RingCentral

**Signal:** Very high
**Theme:** Deterministic-vs-agentic boundary; specialized research swarms; deployment boundary
**Internal relevance:** Cleanest architecture rule for HMC-style financial workflows
**Risk/question:** Implementation specifics need scrutiny, but the boundary principle is sound

### Dust

**Signal:** Medium / incomplete
**Theme:** Agent operating system, possible Stack AI replacement
**Internal relevance:** Possible workspace/runtime category
**Risk/question:** Deployment model needs follow-up

---

## 16. Proposed Internal Reference Architecture

A production-safe internal agent architecture should look roughly like this:

```text
Business user / workflow
→ authenticated subject
→ agent actor identity
→ policy and delegation layer
→ governed capability plane
→ governed context plane
→ model/router/harness
→ tool gateway
→ deterministic service boundary
→ eval / replay / observability
→ audit / incident response
```

### Layer 1: Subject and Actor Identity

Separate the human or business principal from the non-human actor executing work.

Capture:

* user/subject
* agent/actor
* session/task ID
* delegated authority
* scope intersection
* approval state
* risk class

### Layer 2: Governed Capability Plane

Expose sanctioned operations, not raw endpoints.

Capabilities should be:

* typed
* schema-normalized
* identity-aware
* policy-gated
* auditable
* rate-limited
* separated by read/write/action class
* replayable
* versioned

This is the `env.API` / GraphQL/Apollo validation point.

### Layer 3: Governed Context Plane

Expose authorized, versioned context.

Context should include:

* source IDs
* source versions
* index versions
* embedding versions
* visibility windows
* retrieval parameters
* metadata filters
* access policy
* eval lineage

This is the LanceDB / Monte Carlo / search-provenance point.

### Layer 4: Agent Runtime / Harness

The runtime coordinates model calls, tools, task state, budgets, and traces.

Requirements:

* model routing
* task decomposition
* state management
* tool-call planning
* retry policy
* cost budgets
* latency budgets
* trace emission
* guardrail hooks
* human checkpoint hooks

### Layer 5: Tool Gateway

Agents do not call tools directly. They call through a gateway.

Gateway responsibilities:

* schema validation
* policy enforcement
* scope checks
* input/output validation
* prompt-injection controls
* rate limits
* approval gates
* logging
* kill switches
* blocked-action telemetry

### Layer 6: Deterministic Execution Boundary

Known-procedure, high-consequence work should be deterministic.

Agents can propose.
Agents can prepare.
Agents can validate.
Agents can summarize.
Agents can diagnose.
Agents can recommend.

But deterministic systems should execute where the procedure is known and the consequence is material.

### Layer 7: Evals, Replay, and Observability

Every serious workflow needs:

* offline evals
* runtime evals
* golden cases
* synthetic cases
* trajectory scoring
* retrieval scoring
* tool-call scoring
* cost-per-success
* human intervention tracking
* input-to-output lineage
* replayable traces
* failure taxonomy
* incident correlation

---

## 17. HMC Implications

### Implication 1: Do Not Build “Agents.” Build Governed Execution Surfaces.

The platform goal should not be maximum autonomy. It should be constrained autonomy over explicit capabilities.

This is the shift:

> from “what can the agent do?”
> to “what capability is safe to expose, under which identity, with which policy, with which trace, and with which rollback path?”

### Implication 2: `env.API` Is Strategically Central.

`env.API` should be treated as an internal control plane, not a convenience wrapper.

It should encode:

* semantics
* authorization
* audit
* routing
* rate limits
* read/write/action separation
* tool hygiene
* runtime policy
* replayable calls
* agent-safe verbs

The Apollo/GraphQL signal strengthens this. The agent should see the cockpit, not the whole machine.

### Implication 3: A Crimson-Style SDK Must Be Designed as a Security Boundary.

If we create or formalize an internal agent SDK, it cannot just be helper glue. It should encode identity, scopes, trace emission, cost accounting, gateway behavior, context provenance, and policy checks by default.

Convenience without governance will create fragile adoption.

### Implication 4: Internal Search/Retrieval Must Become Provenance-Aware.

Search is not just a user feature. It becomes the memory/context substrate for agents.

We need to know:

* what source version was visible
* what index served the result
* what chunk was retrieved
* what model embedded it
* what filters applied
* what access policy allowed it
* what answer depended on it

This maps directly to current search/index/recon work.

### Implication 5: Data Agents Need Staged Workflows.

Near-term data agents should operate in propose/review mode.

Safe pattern:

1. inspect
2. hypothesize
3. generate candidate query/change
4. run in sandbox
5. produce diff/statistical summary
6. request approval
7. execute through deterministic service
8. log/replay outcome

Bad pattern:

> agent gets database credentials and starts making changes.

### Implication 6: Evals Should Be Designed Before Rollout.

Any internal agent pilot should include eval strategy up front:

* what success means
* what failure means
* what evidence is logged
* what ground truth exists
* what human intervention means
* what cost-per-success target applies
* what regression suite runs
* what guardrails are derived from evals

### Implication 7: Infrastructure Cost/Load Must Be Modeled Early.

Agent volume will hit systems unevenly. Tokens are obvious; databases, queues, auth, logs, retrieval, CI/CD, and observability may be less obvious but equally important.

A serious pilot should include budgets:

* token budget
* tool-call budget
* retrieval budget
* query budget
* trace/log budget
* runtime budget
* retry budget
* human review budget

---

## 18. Recommended Next Steps

### Step 1: Define an HMC-Safe Agent Execution Standard

Create a short internal standard that defines:

* identity model
* delegation model
* capability exposure
* tool gateway requirements
* context provenance
* eval/replay requirements
* observability requirements
* approval levels
* forbidden patterns

This should be platform guidance, not a 40-page policy document.

### Step 2: Build a Minimal Capability Registry

Inventory candidate capabilities and classify them:

* read-only
* draft/propose
* sandbox write
* approved write
* deterministic execution
* never agent-exposed

Each capability should have:

* schema
* owner
* risk class
* auth model
* audit fields
* rate limits
* approval rule
* replay support

### Step 3: Create an Agent Event Schema

At minimum:

* event ID
* task ID
* user subject
* agent actor
* model used
* capability invoked
* tool/input schema
* source/context IDs
* index/source versions
* policy decision
* approval state
* output
* cost
* latency
* trace links
* result/outcome
* human intervention flag

### Step 4: Define a Retrieval Provenance Model

For any agent answer over internal data, capture:

* source artifact
* source version
* index version
* embedding version
* retrieval parameters
* chunks returned
* visibility time
* access scope
* final answer dependency

### Step 5: Choose One Bounded Pilot

Good candidate shapes:

* research/document analysis
* internal search assistant with provenance
* data-quality investigation assistant
* codebase analysis assistant
* operational triage assistant
* agent-assisted PR review
* agent-generated reports with human approval

Avoid first pilots that directly mutate authoritative data or execute high-consequence business actions.

### Step 6: Build Gates and Sweeps Around Agent-Created Artifacts

Borrow the NVIDIA model.

Gates:

* fast checks before acceptance
* policy checks
* security checks
* retrieval/source checks
* test selection
* containerized verification
* approval thresholds

Sweeps:

* nightly trace review
* recurring failure-pattern detection
* stale context detection
* prompt/tool drift detection
* retrieval-quality monitoring
* policy exception review

### Step 7: Prepare Leadership Deck Around Control Plane, Not Hype

Suggested deck spine:

1. Conference thesis: model is no longer the center; control plane is.
2. Evidence of convergence: Apollo, NVIDIA, Bauplan, Monte Carlo, CircleCI, MCP panel, RingCentral.
3. Architecture rule: mediated capability surface, not raw access.
4. Risk rule: known procedure means deterministic system, not agent.
5. Platform implication: identity, context, evals, observability, cost, audit.
6. HMC opportunity: build the substrate before broad autonomy.
7. Recommended pilot: constrained, measurable, replayable, human-gated.

---

## 19. Claims Requiring Verification Before Leadership Use

The directional signals are strong, but some numbers should be verified against source slides or external references before being used in an executive deck:

* 10–15% productivity gain / DX or related study
* 39-point speed perception gap
* 59% PR throughput increase
* pipeline failure and production failure rate claims
* specific CircleCI pipeline-volume figures
* survey percentages from Monte Carlo / agent trust slides
* HubSpot exact count of MCP servers/tools
* Cockroach timeline/traffic-scale projections

These can be used internally as conference-captured signals, but they should be footnoted or softened until verified.

Recommended phrasing for unverified numbers:

* “The panel cited...”
* “The slide claimed...”
* “Conference-captured, not independently verified...”
* “Directionally consistent with the broader pattern...”

---

## 20. Strongest Memo Lines to Preserve

The conference confirmed that enterprise agents are not a model problem; they are a control-plane problem.

Agents need governed capability surfaces, not endpoint piles.

The API layer only becomes the agent layer when it becomes schema-aware, identity-bound, auditable, and policy-mediated.

CLI and GraphQL point toward governed operating surfaces. MCP sprawl points toward unmanaged capability exposure.

MCP servers are not governance.

The agent SDK is not helper glue. It is a security boundary.

Code can fail locally. Data fails socially.

The bottleneck has moved from generation to validation.

If we cannot replay it, score it, and explain it, we should not trust it.

Context is not stuff in the prompt. Context is governed runtime state.

Agent observability is input-to-output lineage across data, retrieval, tools, model behavior, policy, and outcome.

Known procedure means deterministic system, not agent.

Agents belong above the ambiguity boundary. Deterministic systems should retain execution authority.

Agent adoption is capacity planning.

A bad agent does not fail quietly. It behaves like a rogue actor.

The near-term objective is not broad autonomy. It is constrained autonomy over explicit capabilities.

---

## Closing Position

The conference validated the internal architecture direction more than any single product.

The serious talks converged on one conclusion: agents only become enterprise-usable when wrapped in a governed substrate. That substrate has recognizable parts: identity, delegated authority, scoped capabilities, schema, context provenance, replay, evals, observability, deterministic execution boundaries, cost controls, and human verification.

For HMC, the right response is not to chase general agent autonomy. The right response is to build the control plane that makes constrained agentic work safe.

The practical architecture is:

* agents for ambiguity
* deterministic systems for known execution
* mediated capabilities between them
* observability and evals around the whole loop

That is the shape worth taking forward.

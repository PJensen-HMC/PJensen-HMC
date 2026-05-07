# Agent Conference 2026: Production Agent Architecture, Control Planes, and HMC Implications

Stage: `05_outputs`

Prepared: 2026-05-07

Audience: AI team, engineering leadership, platform/security stakeholders

Status: Internal working memo. Suitable as deck substrate after final verification of quoted vendor numbers and OCR-caveated slide details.

Evidence base:

- `02_normalized/source-ledger.md`
- `02_normalized/day1-timeline.md`
- `02_normalized/day2-timeline.md`
- `03_extracted-claims/day1-claims.md`
- `03_extracted-claims/day2-claims.md`
- `03_extracted-claims/vendor-claims.md`
- `03_extracted-claims/slide-claims.md`
- `04_analysis/day1-synthesis.md`
- `04_analysis/day2-synthesis.md`

This memo is an output artifact. It is not raw evidence. Any externally quoted claim should be traced back through the claim IDs and then to the raw source ledger.

## Executive Summary

The strongest conclusion from Agent Conference 2026 is that production agents are not primarily a model-selection problem. They are an enterprise control-plane problem.

Across Day 1 talks, Day 2 talks, booth captures, panels, and OCR-reviewed slides, the same architecture kept reappearing:

- mediated capability surfaces instead of raw endpoint access;
- explicit subject, actor, and delegated authority;
- governed context with provenance, freshness, and permission-aware retrieval;
- deterministic execution boundaries for known procedures;
- staged data mutation surfaces;
- evals, replay, gates, sweeps, and human verification;
- observability across data, semantic, agent, and trust layers;
- infrastructure cost and load modeling for agent-shaped traffic.

The model was not the center of gravity. The operating substrate around the model was.

For HMC, the practical implication is not "adopt agents broadly." The implication is:

> Build the governed substrate that lets non-human actors act safely, measurably, and economically.

The most important internal architecture line:

> Agents should not receive raw access to enterprise systems. They should operate through mediated, schema-aware, identity-bound, auditable capabilities.

## What Changed In This Version

This version replaces the earlier broad conference memo with a claim-backed synthesis aligned to the normalized timeline, extracted claims, slide OCR, vendor claims, and Day 1/Day 2 analysis.

The major corrections are:

1. The memo now treats `env.API` and Crimson-style `env.*` surfaces as the strategic agent execution layer, not as integration plumbing.
2. It elevates identity, delegated authority, and audit lineage from "security concerns" to core architecture.
3. It separates agentic reasoning from deterministic execution.
4. It treats retrieval/context as governed runtime state, not RAG garnish.
5. It treats validation capacity as the main bottleneck after generation accelerates.
6. It makes infrastructure load and token economics first-class rollout concerns.
7. It caveats vendor and OCR-backed claims explicitly.

## Core Thesis

Enterprise agent systems should be designed as mediated execution architectures for non-human actors.

A production agent system is not:

- a chatbot;
- a workflow builder;
- a model wrapper;
- a pile of tools;
- an MCP catalog;
- a prompt wired to APIs.

A production agent system is closer to:

- identity-bound actor;
- scoped capabilities;
- governed context;
- deterministic handoff boundary;
- eval and replay system;
- observability surface;
- cost and runtime control loop;
- audit and incident-response substrate.

The clearest cross-day synthesis:

> Agents are not the product. The product is the governed runtime that lets agents act safely, measurably, and economically.

## 1. The Agent Layer Is A Mediated Capability Layer

Evidence: `D2-C005`, `V-C001`, `D1-C010`, `SL-C006`, `SL-C007`

The cleanest proprietary implication is the `env.API` / governed capability-surface thesis.

The weak pattern:

- Agents receive a bag of tools.
- Agents see broad endpoint catalogs.
- Permissions are ambiguous.
- Tool choice is left to the model.
- Audit is bolted on after behavior exists.

The stronger pattern:

- Enterprise systems stay behind a mediated layer.
- Capabilities are schema-normalized.
- Inputs and outputs are typed.
- Identity and delegation are explicit.
- Reads and writes are separated.
- Side effects are known.
- Calls are logged and replayable.
- Blast radius is deliberate.

Apollo was the clearest booth validation. The booth capture described API-schema ingestion, GraphQL-style mediation, identity, control-layer packaging, and avoidance of raw endpoint sprawl. That matters because an agent should not discover the enterprise through arbitrary endpoints. It should operate through curated capability surfaces.

Internal implication:

> `env.API` should be treated as a first-class product surface where semantics, authorization, audit, action policy, and non-human actors meet.

This is not just an SDK concern. It is the safety boundary.

## 2. Identity Is The Security Boundary

Evidence: `D1-C005`, `D1-C010`, `D1-C013`, `SL-C012`, `SL-C013`, `D2-C014`, `SL-C022`

Several conference threads converged on the same warning: static API keys are not an identity model for agents.

Agent systems need to distinguish:

- who requested the action;
- what actor executed the action;
- which authority chain was used;
- which capabilities were in scope;
- which policy allowed the action;
- what was observed, changed, denied, or escalated.

The missing primitive is the subject/actor distinction. A human user, service account, autonomous agent, scheduled job, and external customer-facing agent are not interchangeable. When these collapse into one credential, the system loses chain of custody.

The stronger pattern is intersection authorization: effective permissions should be the strict intersection of user scope and agent scope, with immutable audit lineage across hops.

Internal implication:

> Do not give agents broad, long-lived credentials. Give them scoped, delegated, auditable capabilities mediated by the platform.

## 3. Context Engineering Has Replaced Naive RAG

Evidence: `D1-C007`, `SL-C003`, `SL-C004`, `SL-C005`, `D2-C006`, `D2-C013`, `SL-C021`

The retrieval story was not "add a vector database." The stronger signal was that context has become governed runtime state.

Production context has to answer:

- Which source version produced this embedding?
- Which index served this answer?
- Which metadata traveled with the retrieved passage?
- Which permissions applied at retrieval time?
- Why was this memory visible to this actor?
- How fresh was the source?
- Can the retrieval path be replayed?

Monte Carlo's readiness framing adds the cross-layer observability point: data, semantic behavior, agent build, and trust are one operating plane. A bad answer may originate in stale data, broken schema, weak chunking, embedding drift, missing metadata, or tool behavior. If those layers are not connected, teams will blame the prompt when the real defect lives upstream.

Internal implication:

> HMC search/indexing work should be designed as provenance-aware context infrastructure, not as prompt support.

The right target is a context cockpit: narrow, explainable, permission-aware, source-linked, and replayable.

## 4. Data Agents Need Safe Failure Surfaces

Evidence: `D2-C007`, `SL-C015`, `SL-C016`, `SL-C017`

Bauplan's data-agent material made the data version of agent safety concrete.

Code agents can fail inside relatively forgiving surfaces:

- branches;
- diffs;
- tests;
- preview environments;
- pull requests;
- rollback paths.

Data agents do not automatically have those surfaces. Data failures are shared, slow, and often expensive. A bad mutation can pollute analytics, workflows, decisions, compliance artifacts, and customer outcomes.

"Git for data" is compelling because it imports the safety model from software delivery into data mutation. The implementation details need verification, but the architectural need is clear: data agents require isolated change surfaces, reviewable deltas, statistical checks, lineage, merge discipline, and controlled promotion.

Internal implication:

> HMC agents should not directly mutate authoritative business data. They should propose changes through dry run, sandbox state, diff, test, review, audit, and controlled promotion.

## 5. Validation Is Now The Bottleneck

Evidence: `D1-C011`, `D1-C014`, `D1-C015`, `SL-C009`, `D2-C010`, `D2-C012`, `SL-C019`, `SL-C020`

The most operational conference signal was that AI accelerates generation before it accelerates validation.

NVIDIA, CircleCI, OpenAI/Databricks panel notes, and the coding-agent material all pointed in the same direction: the bottleneck moves from creating candidate work to proving that the work is correct, safe, reviewable, deployable, and recoverable.

The CircleCI/METR slide matters because it separates felt speed from measured speed. Developers may feel faster while reliability, recovery, review burden, or total throughput gets worse.

The useful primitives are:

- gates to stop known failure modes before promotion;
- sweeps to find recurring or cross-cutting issues;
- evals over traces, not just prompts;
- replayable environments;
- small reviewable diffs;
- provenance on generated artifacts;
- human intervention labels;
- cost per successful outcome.

Internal implication:

> HMC should design verification surfaces before broad agent deployment, not after the first agent demo works.

## 6. Deterministic Boundaries Matter More, Not Less

Evidence: `D2-C009`, `D2-C015`, `SL-C023`, `SL-C024`, `SL-C025`, `SL-C026`

The RingCentral material crystallized a rule that should govern HMC architecture:

> Use agents where ambiguity earns the complexity cost. Keep known-procedure execution deterministic.

Agents are useful for:

- research;
- ambiguity;
- hypothesis generation;
- comparison;
- synthesis;
- proposal generation;
- user assistance where intent is unclear.

Deterministic systems should handle:

- known procedures;
- validated execution;
- deployment;
- enforcement;
- persistence;
- audit;
- repeatable policy;
- critical destructive actions.

The strongest architecture keeps these roles separate. The agent proposes, researches, explains, and prepares. Deterministic systems execute, test, enforce, deploy, and measure. Validated outputs cross a visible boundary.

Internal implication:

> Crimson should not collapse reasoning, execution, policy, persistence, and audit into one agent blob. The handoff boundary should be visible in code and operations.

## 7. Infrastructure Load Is Underpriced

Evidence: `D1-C010`, `SL-C014`, `D2-C011`, `SL-C018`, `V-C003`

Agent traffic is not human traffic.

Humans pause, read, think, and leave. Agents can call tools continuously, retry aggressively, inspect everything, run 24/7, and multiply as teams deploy more of them.

That changes load on:

- databases;
- APIs;
- auth systems;
- queues;
- CI/test systems;
- search indexes;
- logging and tracing;
- observability platforms;
- systems of record;
- model gateways and inference capacity.

This is not only a GPU or token-budget concern. It is enterprise capacity planning.

The DataRobot token-economics slides add the finance angle: inference capacity needs allocation, admission control, tiers, budgets, and stable enough behavior for planning.

Internal implication:

> Any agent rollout should model agent-shaped traffic separately from human traffic.

## 8. MCP Is A Connection Pattern, Not A Security Model

Evidence: `D2-C014`, `SL-C022`

MCP is useful because it simplifies tool connection. That same convenience makes governance risk more visible.

The conference signal was not "MCP is bad." The signal was:

- tool sprawl is easy;
- trace leakage is real;
- service-account ambiguity is dangerous;
- internal and customer-facing agents need different policies;
- destructive action requires stronger controls;
- transport/runtime standards do not replace authorization, audit, DLP, or action policy.

The practical first rule from the notes is simple and worth preserving:

> Do not hard delete.

Internal implication:

> HMC should wrap MCP-like surfaces in actor identity, user delegation, scoped exposure, criticality policy, audit, trace hygiene, DLP, and review gates.

## 9. Customer And Banking Use Cases Reveal The Moral Edge

Evidence: `D2-C002`, `D2-C003`, `D2-C004`, `SL-C002`

The T-Mobile / Distyl and Axos / OutSystems material was useful because it showed both enterprise ambition and enterprise risk.

Customer-service agents can increase agency if they help people accomplish tasks, understand options, and escalate cleanly. They become containment systems if success is measured mostly by avoided calls.

Banking agents can help wrap legacy cores, analyze logs, reduce SDLC friction, and improve delivery safety. They become surveillance systems when management instrumentation and timecard monitoring become the primary use case.

The same substrate can reduce toil or intensify control.

Internal implication:

> Use-case choice is moral architecture. Prefer pilots that improve user agency, reduce toil, or increase system reliability. Treat worker surveillance, opaque deflection, and automated authority as red flags.

## HMC Reference Architecture

The conference points toward an HMC agent substrate with eight layers.

### Layer 1: Subject And Actor Identity

Distinguish human requester, service principal, agent actor, delegated authority, session, and execution context.

Required properties:

- subject/actor separation;
- scoped delegation;
- intersection authorization;
- immutable audit lineage;
- short-lived credentials;
- policy-aware capability grants.

### Layer 2: Governed Capability Plane

Expose actions as sanctioned capabilities, not endpoint dumps.

Required properties:

- typed inputs and outputs;
- known side effects;
- read/write separation;
- action criticality;
- policy hooks;
- replayable call logs;
- versioned capability definitions.

This is where `env.API` becomes strategically central.

### Layer 3: Governed Context Plane

Provide permission-aware context with provenance and freshness.

Required properties:

- source IDs;
- source versions;
- index versions;
- retrieval traces;
- metadata lineage;
- permission checks;
- expiration/freshness rules;
- replayable context assembly.

### Layer 4: Agent Runtime And Harness

Run agents inside constrained execution environments.

Required properties:

- bounded tools;
- run IDs;
- prompts and config versions;
- trace capture;
- cost tracking;
- retry policy;
- sandboxing;
- deterministic stop conditions where possible.

### Layer 5: Tool Gateway

Centralize tool exposure and policy.

Required properties:

- tool registry;
- scoped grants;
- criticality classification;
- DLP/trace hygiene;
- rate limits;
- customer/internal policy separation;
- soft-delete defaults;
- explicit review gates for destructive actions.

### Layer 6: Deterministic Execution Boundary

Keep known procedures in testable systems.

Required properties:

- workflow engines;
- typed commands;
- validation layers;
- idempotency;
- rollback/compensation;
- CI/CD;
- deployment controls;
- policy enforcement outside the model.

### Layer 7: Evals, Replay, And Observability

Treat evals as continuous operations, not a one-time prompt test.

Required properties:

- trace sampling;
- replay datasets;
- human intervention labels;
- task success metrics;
- cost per successful outcome;
- variance and repeatability tracking;
- regression detection;
- data/semantic/agent/trust observability.

### Layer 8: Infrastructure And Economics Control

Model agent load separately.

Required properties:

- token budgets;
- model gateway metering;
- admission control;
- rate limits by actor/capability;
- database/API/queue capacity plans;
- CI/test capacity plans;
- observability volume plans;
- SLA tiers for high-priority vs low-priority agent work.

## HMC Implications

### Implication 1: Do Not Build "Agents." Build Governed Execution Surfaces.

The dangerous internal question is "what agents should we build?"

The better question is:

> What actions are we willing to let a non-human actor propose, prepare, execute, or escalate, under which identity, policy, and audit boundary?

Agents are consumers of the substrate. The substrate is the durable platform investment.

### Implication 2: `env.API` Is Strategically Central.

`env.API` should be designed as the mediated capability layer for both humans and non-human actors.

That means it should carry:

- schema;
- semantics;
- auth;
- delegated authority;
- action policy;
- observability;
- replay;
- audit;
- criticality classification;
- deterministic execution hooks.

If `env.API` becomes merely a proxy, it misses the strategic moment. If it becomes the governed surface where business capability meets non-human actors, it becomes the foundation of HMC's agent architecture.

### Implication 3: A Crimson-Style SDK Must Be Designed As A Security Boundary.

The SDK should not just make calls easy. It should make unsafe calls hard.

SDK primitives should prefer:

- scoped capabilities over raw clients;
- typed commands over ad hoc payloads;
- explicit subject/actor context;
- provenance-bearing reads;
- dry-run and diff modes;
- review-gated writes;
- audit event emission by default.

### Implication 4: Internal Search And Retrieval Must Become Provenance-Aware.

Search quality alone is not enough.

HMC needs to know which source, version, permission state, embedding/index version, and retrieval path produced the context an agent used.

This matters for:

- debugging;
- compliance;
- user trust;
- eval repeatability;
- incident response;
- prompt/regression analysis;
- authorization review.

### Implication 5: Data Agents Need Staged Workflows.

A safe HMC data-agent workflow should look more like software delivery than direct database mutation:

1. propose;
2. dry run;
3. create isolated state;
4. produce diff;
5. run checks;
6. route review;
7. promote deterministically;
8. record lineage and audit.

### Implication 6: Evals Should Be Designed Before Rollout.

For any pilot, define evaluation before deployment:

- intended task;
- allowed context;
- allowed actions;
- expected output;
- human review point;
- success metric;
- unacceptable failure modes;
- replay set;
- trace schema;
- intervention labels;
- cost metric.

Without this, the organization will get demo success and operational ambiguity.

### Implication 7: Infrastructure Cost And Load Must Be Modeled Early.

Agent-shaped load should be part of rollout design.

For each proposed agent, estimate:

- model calls;
- tool calls;
- database/API reads and writes;
- auth checks;
- queue volume;
- CI/test usage;
- search/index usage;
- observability volume;
- retry behavior;
- run frequency;
- worst-case fanout.

The infrastructure question is not only "can we pay for tokens?" It is "what does continuous non-human action do to every shared system?"

## Recommended Next Steps

### Step 1: Define An HMC-Safe Agent Execution Standard

Create a short internal standard covering:

- subject vs actor identity;
- delegated authority;
- capability exposure;
- action criticality;
- read/write separation;
- dry-run requirements;
- review gates;
- audit event requirements;
- trace hygiene;
- DLP;
- hard-delete policy.

### Step 2: Build A Minimal Capability Registry

For one bounded domain, list capabilities instead of endpoints.

For each capability, define:

- name;
- owner;
- inputs;
- outputs;
- side effects;
- read/write classification;
- required permissions;
- allowed actor types;
- criticality;
- audit fields;
- rollback/compensation path.

### Step 3: Create An Agent Event Schema

Define a shared event schema before pilots proliferate.

Minimum fields:

- run ID;
- task ID;
- subject ID;
- actor ID;
- capability ID;
- tool call;
- input reference;
- output reference;
- source/context references;
- decision rationale summary;
- policy decision;
- human intervention;
- cost counters;
- latency counters;
- success/failure classification.

### Step 4: Define A Retrieval Provenance Model

Make source traceability a first-class context feature.

Minimum fields:

- source ID;
- source version;
- index version;
- retrieval query;
- retrieved object ID;
- permission check;
- timestamp;
- freshness/expiration;
- downstream output reference.

### Step 5: Choose One Bounded Pilot

Choose a pilot that:

- reduces internal toil;
- has clear ownership;
- has limited blast radius;
- can run read-only or proposal-first;
- has measurable success;
- has reviewable output;
- can be replayed;
- avoids worker-surveillance or customer-containment incentives.

Good candidate shapes:

- internal knowledge/retrieval assistant with provenance;
- PR/change summarizer with required checks;
- incident/reliability research assistant;
- data-quality proposal agent that cannot mutate production directly;
- API capability discovery assistant over a constrained registry.

### Step 6: Build Gates And Sweeps Around Agent-Created Artifacts

Before broad rollout, define:

- gate checks for known failure modes;
- scheduled sweeps for recurring drift;
- human review surfaces;
- trace sampling;
- rollback paths;
- incident playbooks.

### Step 7: Prepare Leadership Narrative Around Control Plane, Not Hype

The leadership framing should be:

> We are not betting on autonomous magic. We are building the control plane that lets non-human actors operate within explicit boundaries.

This is more credible than "AI transformation" and more actionable than "build agents."

## Claims Requiring Verification Before Leadership Use

Do not present the following as final external facts without checking raw source detail:

- Any vendor-specific performance number or adoption percentage.
- Bauplan's 90% agent-driven development framing.
- CircleCI/METR speed measurements.
- Any OCR-caveated slide wording.
- Apollo product packaging details beyond the booth capture.
- RingCentral slide claims where image OCR preserved only partial text.
- CockroachDB load claims where the claim is directional but not quantified.

The architecture conclusions do not depend on those numbers being exact. The claims should still be verified before formal leadership presentation.

## Strongest Memo Lines To Preserve

> Agents should not receive raw access to enterprise systems. They should operate through mediated, schema-aware, identity-bound, auditable capabilities.

> The API layer only becomes the agent layer when it stops being an endpoint dump and becomes a governed capability surface.

> Agents are not the product. The product is the governed runtime that lets agents act safely, measurably, and economically.

> Use agents where ambiguity earns the complexity cost. Keep known-procedure execution deterministic.

> AI accelerates generation first. The bottleneck moves to validation, review, observability, and operational confidence.

> MCP is a connection pattern, not a security model.

> Agent-shaped traffic is not human-shaped traffic.

> Use-case choice is moral architecture.

## Traceability Map

Primary Day 1 support:

- Retrieval/context infrastructure: `D1-C007`, `SL-C003`, `SL-C004`, `SL-C005`
- Below-waterline production substrate: `D1-C010`, `SL-C006`, `SL-C007`, `SL-C010`, `SL-C011`, `SL-C014`
- Identity and delegated authority: `D1-C005`, `D1-C010`, `D1-C013`, `SL-C012`, `SL-C013`
- Evals as operations: `D1-C014`, `SL-C009`
- Coding-agent review bottleneck: `D1-C011`, `D1-C015`, `SL-C011`

Primary Day 2 support:

- API/capability mediation: `D2-C005`, `V-C001`
- Data-agent safety: `D2-C007`, `SL-C015`, `SL-C016`, `SL-C017`
- Validation bottleneck: `D2-C010`, `D2-C012`, `SL-C019`, `SL-C020`
- Context engineering and observability: `D2-C006`, `D2-C013`, `SL-C021`
- Infrastructure load and economics: `D2-C011`, `SL-C018`, `V-C003`
- MCP governance: `D2-C014`, `SL-C022`
- Deterministic boundaries: `D2-C009`, `D2-C015`, `SL-C023`, `SL-C024`, `SL-C025`, `SL-C026`
- Customer/banking use-case risk: `D2-C002`, `D2-C003`, `D2-C004`, `SL-C002`

## Closing Position

The conference did not make the case for agents everywhere.

It made the case for a governed execution architecture where agents are one class of actor inside a broader system of identity, capability mediation, context provenance, deterministic execution, evals, observability, infrastructure controls, and human verification.

For HMC, the durable bet is not one impressive agent. The durable bet is the substrate that makes many bounded agents possible without surrendering control.

# NYC Agent Conference — Day 2 Memo

## Executive summary

Day 2 was high signal because the serious talks converged on the same architecture from different directions. The conference was not really about “agents” as chatbots. It was about what has to exist around agents before enterprises can safely let them do work.

The repeated primitives were:

schema
identity
context engineering
evals
observability
data lineage
deterministic execution
blast-radius control
infrastructure scaling
human verification

The strongest takeaway: the model is no longer the center of the conversation. The control plane is.

Agents need mediated capability surfaces, not raw endpoint access. They need deterministic execution layers, replayable environments, eval harnesses, data observability, permission boundaries, and clear human verification points. This showed up in the Apollo hallway conversation, Bauplan’s data-branching model, Google’s non-human actor systems design, NVIDIA’s gates/sweeps framing, Cockroach’s infrastructure warning, Monte Carlo’s trust layer, the MCP panel’s auth/security concerns, and RingCentral’s deterministic-versus-agentic boundary. 

The meta-observation: this was not networking. It was field validation. The day functioned as a live scanner for whether the industry is converging on the same architecture we have already been circling internally.

## 1. The agent layer is really a mediated capability layer

The Apollo hallway conversation was one of the cleanest validations of the day. Their framing was basically: ingest Swagger/OpenAPI, wrap existing APIs, apply schema and identity, and avoid handing agents a pile of raw endpoints. That maps directly to the `env.API` thesis.

The important distinction:

Bad pattern:
Agent gets a large bag of tools.
Agent gets broad endpoint access.
Agent receives ambiguous permissions.
Agent decides what matters.
Audit is bolted on later.

Better pattern:
Enterprise systems stay behind a mediated layer.
Capabilities are schema-normalized.
Identity is explicit.
Actions are constrained.
Reads and writes are separated.
Calls are logged and replayable.
Blast radius is deliberate.

This is not integration plumbing. It is the agent safety boundary.

Crimson implication: `env.API` should be treated as a first-class product surface. It is not just a route proxy. It is where semantics, authorization, audit, action policy, and non-human actors meet.

## 2. Data safety is the hardest version of agent safety

Bauplan’s talk was one of the most useful because it made the danger concrete: people are increasingly comfortable letting agents write code, but almost nobody is comfortable letting agents touch production data.

Their core distinction was correct:

Code can fail locally.
Data fails socially.

With code, we have Git, branches, diffs, pull requests, tests, and rollback patterns. Agents can fail safely because the development harness allows controlled failure. With data, failure can mean corrupted tables, broken pipelines, inconsistent states, expensive 8-hour runs, or silent downstream damage. 

The phrase worth preserving: move fast, fail fast, break local things.

That is exactly the missing primitive for data agents. The data world needs safe failure surfaces: branches, snapshots, statistical checks, lineage, review, dry runs, and conflict-resolution models.

Your reaction was right: “Git for data” is attractive, but the hard question is whether data branching is real enough at enterprise scale, or whether it is a useful metaphor hiding a hard infrastructure problem.

Crimson implication: agents should not mutate authoritative business data directly. They should operate through mediated, staged, inspectable workflows. Any write path needs preflight, review, audit, rollback, and ideally synthetic/sandbox state before touching real systems.

## 3. The bottleneck has moved from generation to validation

NVIDIA’s talk was probably the clearest engineering-practice talk of the day. The useful story was not “NVIDIA uses AI.” It was that once coding harnesses and CLIs spread internally, velocity exploded and validation became the constraint.

Their framing of research, gates, and sweeps is important.

Research:
Use agents to map the system.
Inspect history.
Find seams.
Generate diagrams.
Understand topology before changing code.

Gates:
Block rot from entering production.
Run layered PR checks.
Use fast feedback.
Choose test suites intelligently.
Run behavioral verification in real containers.
Check drift, conflicts, security, architecture alignment, and coverage.

Sweeps:
Clean what gates cannot see.
Run nightly or repeated checks.
Detect recurring review patterns.
Tighten standards over time.

Your reaction was right: this matches the real enterprise problem. We can now generate more change than existing engineering systems can absorb. The scarce resource becomes verification capacity, not code production. 

The strongest concept: the velocity gap.

Writing code accelerates first.
Understanding, validating, reviewing, integrating, and governing code lag behind.

This also appeared in the CircleCI / OpenAI / Databricks panel. The reported productivity gains were more modest than the hype — around 10–15% in the notes — while CI failures and pipeline pressure are increasing. The room’s “aha” moment around multiple agents reviewing one another matters: confidence is becoming a systems problem, not an individual-review problem. 

Crimson implication: we need explicit gates and sweeps around agent-created artifacts. Not vibes. Not “the agent passed tests.” Real gates: provenance, ownership, semantic checks, execution traces, environment-specific validation, and rollback paths.

## 4. Context engineering is replacing naïve RAG

Several talks independently moved away from “RAG solves it” and toward a broader context-engineering model.

Mistral emphasized smaller models, fine-tuning, steering, evals, observability, calls, and messy enterprise data. The signal was that model access is no longer enough. Production requires a pipeline: define the task, organize data, steer behavior, evaluate outputs, observe calls, and manage cost. 

Cockroach’s talk landed on a similar point from the infrastructure/data side: every agent needs a curated knowledge domain it can safely draw from. They described an ontology built from customer-call transcripts, Q&A pairs, and canonical questions. Your reaction was immediate: this is governance, recall, and point-in-time context, not a new idea dressed up as magic. 

Monte Carlo made the failure chain more explicit:

source data
chunking
embedding
vector store
retrieval
agent behavior
output trust

The important point: agent failures are often data failures in disguise. Teams blame prompts or models while the actual issue is a source table, schema change, stale pipeline, broken chunking strategy, bad embedding, or retrieval drift. 

Crimson implication: data and AI cannot be managed as separate planes. The agent layer needs observability into source freshness, semantic meaning, lineage, retrieval behavior, and output quality. Context is not “stuff in the prompt.” Context is governed runtime state.

## 5. Small models are back because economics are back

Mistral’s model-size framing was useful because it cut through the frontier-model default. The production question is not “what is the smartest model?” It is “what is the smallest, cheapest, fastest model that can reliably do this bounded job?”

Notes called out 1B, 2B, 3B, 24B, edge use cases, latency, connectivity, cost, and open-weight deployment. The implied architecture is heterogeneous: frontier models for ambiguous reasoning and synthesis; smaller models for narrow, repeated, latency-sensitive, cost-sensitive, private, or edge-bound work. 

The important economic line: subsidies are going away.

The POC phase hid inference economics. Production brings them back. Tokens in, tokens out, latency, hardware, deployment footprint, and evaluation cost all become architectural constraints.

Crimson implication: if we build strong capability surfaces and deterministic layers, we do not always need the largest model. Narrower surfaces make smaller models more viable.

## 6. Infrastructure is the sleeping monster

Cockroach delivered the most aggressive infrastructure warning: agent-driven load has not fully landed yet.

The distinction matters:

Human load is paced by human attention.
Agent load is not.

A thousand humans and a thousand agents are not equivalent. Agents can proliferate, retry, query exhaustively, inspect logs, generate code, trigger CI, call tools, and hammer systems of record in patterns that legacy capacity planning did not assume.

Their warning was that systems of record, messaging, durability, correctness, elastic scale, and surge handling become pressure points. The line underneath it: intelligence may become cheap, but infrastructure will not be free. 

Your reaction was also the right one: leadership is likely underestimating this. Most AI strategy discussions are still model/application centric. They are not yet modeling agent-shaped load against databases, queues, auth systems, observability systems, CI systems, and enterprise APIs.

Crimson implication: agent adoption needs capacity planning. Not just GPU planning. Systems-of-record planning.

## 7. MCP is useful, but the auth/security surface is ugly

The MCP panel was valuable because it exposed the mess.

The obvious problem: tool explosion. HubSpot reportedly has thousands of tools exposed behind MCP-style surfaces; Groupon and PagerDuty are dealing with many agents, many MCPs, and infrastructure-critical use cases. 

The harder problem: authorization.

Patterns discussed included:

acting “as the user”
service accounts
separate MCP servers
criticality-based separation
customer-facing versus internal agents
union of user and agent permissions
audit instead of hard delete
data leakage into traces
private conversations entering tool logs
DLP becoming more important

The critical distinction: internal agents and external/customer-facing agents are very different games. Internal agents may operate in a trusted environment with more audit and recovery options. External-facing agents introduce user intent, delegated authority, hallucinated actions, and unclear liability.

Crimson implication: do not treat MCP as a security model. MCP is a connection/runtime pattern. The security model has to live around it: identity, scope, policy, audit, trace hygiene, service-account strategy, and action-specific controls.

## 8. The deterministic/agentic boundary is architectural law

RingCentral’s final talk may have been the cleanest closing synthesis. The core line: not everything needs to be an agent.

This matters because agentic systems are seductive. Teams will over-agent workflows that should remain deterministic. That is how systems become expensive, flaky, untestable, and impossible to reason about.

Their trading-agent example was useful because it separated:

Agentic layer:
hypothesis
research
open-ended reasoning
strategy generation
signal discovery
explanation

Deterministic layer:
execution
backtesting mechanics
known procedures
constraints
deployment controls
performance measurement

The boundary is the architecture. Agents produce candidates. Deterministic systems execute, test, gate, and enforce constraints.

The failure modes were also strong:

overfitting
correlated convergence
strategy drift
runaway research compute
poor explainability
generalist agents producing shallow work

Your reaction was correct: this maps directly to enterprise AI. Specialize deeply. Keep known procedures deterministic. Use agents where judgment, exploration, and hypothesis generation are actually needed. Govern the boundary between research and production. 

The strongest line: architecture is the management structure.

Crimson implication: micro-apps and agents should not collapse reasoning, execution, policy, and persistence into one blob. The system should make the boundary visible.

## 9. Customer experience talks were useful, but contradictory

The T-Mobile / Distyl thread was valuable because it showed real enterprise ambition, but it also exposed the contradiction in customer-service AI.

The positive case:
T-Mobile has clear pain points.
They look at NPS continuously.
Leadership is strongly committed.
They are trying to scale high-quality human support patterns.
Forward-deployed AI teams appear to work better than traditional consulting.
They have concrete products like Intent-CX / T-Life / Journey Bot.
The 80-year-old upgrade story made the agency-enhancing version plausible.

The contradiction:
They say “customer-centric” and “personal,” while also aiming for customers not to call.
That can mean better self-service.
It can also mean automated containment.

The difference is customer agency.

If the bot helps a customer accomplish something they otherwise could not, it is customer-centric. If the bot prevents escape to a human while optimizing deflection, it is cost containment with softer language.

Crimson implication: AI experiences should be measured on successful resolution, user agency, escalation quality, and after-the-fact trust — not just avoided calls or reduced handling cost.

## 10. Banking talk: useful but mixed

The Axos / OutSystems banking talk had useful elements but also some uncomfortable ones.

Useful:
They framed legacy systems as the real substrate.
They discussed wrapping the core for agility without risking stability.
They started internally with logs and SDLC personas.
They focused on narrow use cases through an agent workbench.
Fine-grained agents seemed directionally right.

Mixed / concerning:
Code review ROI claims need scrutiny.
Management/timecard-monitoring agents sounded culturally ugly.
The “monitor what applications people are running” pattern feels like a surveillance sink unless tightly governed.

Your reaction should be preserved: some pieces were real; some were gross. That matters. Agent adoption can produce leverage, but it can also produce managerial instrumentation that feels like a category error.

Internal takeaway: choose use cases that increase system intelligence and reduce toil, not use cases that turn workers into telemetry sources.

## Key internal implications

First, `env.API` is strategically important. It should be framed as a governed capability layer for non-human actors, not just application integration.

Second, Crimson’s `env.*` model maps well to where the market is going: synthetic capabilities, constrained access, identity-aware execution, auditability, and deterministic boundaries.

Third, agent readiness is not mostly about model selection. It is about whether the enterprise has schemas, data quality, context discipline, observability, test harnesses, evals, lineage, and policy.

Fourth, validation will become the main bottleneck. We should invest in gates, sweeps, replay, trace inspection, and agent-generated artifacts that are easy for humans to verify.

Fifth, internal AI systems should distinguish clearly between:
reasoning
planning
research
execution
persistence
policy
audit

Sixth, small models become more plausible when the operating surface is well-designed. Big models compensate for ambiguity. Better systems reduce ambiguity.

Seventh, agent load should be treated as a new infrastructure class. We should assume agent traffic patterns will differ materially from human traffic patterns.

## Proposed internal thesis

The enterprise agent stack is not a chatbot stack.

It is a mediated execution architecture for non-human actors. The critical layers are schema, identity, context, deterministic execution, evals, observability, data lineage, and governance. Models matter, but they are only one part of the stack. The durable advantage will come from shaping the operating surface so agents can act safely, cheaply, and verifiably.

## Sharp version

The industry is converging on a simple truth: agents should not be trusted; systems should be designed so they do not need to be trusted.

Give agents narrow capabilities.
Give them context with provenance.
Give them deterministic execution paths.
Give them evals and replay.
Give humans verification leverage.
Give infrastructure a fighting chance.

That was Day 2.

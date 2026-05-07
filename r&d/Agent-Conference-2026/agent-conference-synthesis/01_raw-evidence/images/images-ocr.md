# Agent Conference Image Extraction Ledger

RAW extraction from uploaded conference photos.  
Preserves filenames, visible slide text, uncertainty, and immediate signal notes.

---

# Batch 0 / Example

## 20260505_101406.jpg

### Visible text

What’s blocking the transition to agentic banking systems

Fragmented agentic stacks hinder real delivery

→ Apps and AI agents together in one integrated experience & lifecycle

Tension between regulations and AI disruption

→ Agentic architectures with security, auditability, and compliance baked in

Core banking systems paralyze innovation

→ A way to wrap that core to get agility without risking stability

### Signal

Banking / financial-services framing. Core message is not “agents replace banking systems,” but “agents wrap or integrate with legacy core systems under security, auditability, compliance, and lifecycle control.”

Useful for enterprise synthesis:

Fragmented agent stacks are not production architecture. Regulated environments need bounded capability surfaces, audit trails, and integration around legacy systems.

---

# Batch 1

## 20260504_105627.jpg

### Visible text

LanceDB

AI AGENT CONFERENCE 2025

What Agents Want:  
Beyond One-Size-Fits-All Retrieval Systems

Chang She / LanceDB

### Signal

Session title slide.

Core topic: retrieval architecture for agents, specifically arguing against generic / vector-only retrieval.

---

## 20260504_110303.jpg

### Visible text

LanceDB

May the 4th be with you.

The model can seem like jedi mind-tricks, but…

Production agents still need very non-magical systems: context, memory, retrieval, provenance, and latency budgets.

### Signal

Clean thesis slide.

Important because it collapses the hype into infrastructure requirements.

Strong quote candidate:

Production agents still need very non-magical systems: context, memory, retrieval, provenance, and latency budgets.

Material point:

Retrieval is not decorative. It is part of the production control plane.

---

## 20260504_110958.jpg

### Visible text

LanceDB

A vector database isn’t enough for agents

Diagram, left to right:

vector index → raw data → metadata → eval logs → orchestrator

Questions:

Which source version produced this embedding?

Which index served the evaluation run?

When did derived context become visible?

### Signal

Strongest slide in Batch 1.

Vector search alone is insufficient because agent retrieval needs provenance, eval traceability, lifecycle state, and reproducibility.

Maps directly to index / recon thinking:

Not just “what did retrieval return,” but:

Which version?

Which index?

Which visibility boundary?

Which eval run?

### Raw synthesis note

LanceDB’s argument was not “use our vector DB.” The stronger version was: production retrieval for agents is a provenance and lifecycle problem. Agents need memory, context, retrieval, eval logs, metadata, and latency budgets wired together. A vector index by itself is an incomplete substrate because it cannot answer operational questions like source version, index version, evaluation lineage, or when derived context became visible.

---

# Batch 2

## 20260504_141312.jpg

### Visible text

DataRobot

Three foundations. One outcome.

Each is a gating condition for production ROI. None of them, alone, will get a standing ovation.

Developer Experience  
Enterprise hooks built into the platform — not bolted on by every team.

Agent Identity  
Verifiable, scoped, delegated authority — no shared service accounts.

Token Factory Economics  
Pools, premium/spot tiers, deterministic admission — predictable margin at scale.

### Signal

Clean executive framing slide.

Three production gates:

Developer experience

Identity

Economics

Aligned with enterprise-agent-readiness-below-the-demo-layer thesis.

---

## 20260504_141511.jpg

### Visible text

DataRobot is the platform built below the waterline.

Enterprise hooks, built in  
Bring your agent code; layer in auth, audit, eval, and governance — without rewriting a line.

First-class agent identity  
Verifiable identity, scoped delegation, and an audit trail your security team will sign off on.

Token pools with predictable economics  
Premium and spot tiers, deterministic admission control, and stable SLAs at scale.

### Signal

“Below the waterline” is the core metaphor.

Agent platforms should handle invisible production infrastructure:

Auth

Audit

Eval

Governance

Identity

Token economics

---

## 20260504_141645.jpg / 20260504_141650.jpg

### Visible text

Research API: The Best Models + The Best Tools

Built on key primitives: our Search API & our Contents API

Built a harness optimized for agentic search. Single-agent inference scaling up to 10M tokens, 1,000 turns

Designed scalable search compute — budget awareness as an optimization strategy

Tools will be the big differentiator for longer horizon, complex tasks as underlying foundation models improve

Use our Search and Contents APIs within your own harness and achieve SOTA on your domain

Chart title:

DeepSearchQA

Blog: Introducing the You.com Research API  
Date: 02/26/2026

### Signal

Not generic “search is useful.”

Search is positioned as compute infrastructure for long-horizon agents.

Important phrase:

Budget awareness as an optimization strategy.

Connects to token-budget / CFO / ROI notes.

---

## 20260504_141800.jpg

### Visible text

Title:

Stochasticity in Agentic Evaluations: Quantifying Inconsistency with Intraclass Correlation

Authors:

Zairah Muthukhan, Abel Lim, Megna Anand, Saahil Jain, Bryan McCann

Emails appear to be You.com addresses.

Abstract visible enough to extract gist:

Agentic evaluation is stochastic.

Single-run reporting can obscure variance.

The paper proposes using Intraclass Correlation Coefficient, ICC, to distinguish true capability improvements from measurement noise.

It studies GAIA and FRAMES across multiple trials/models.

It finds substantial instability depending on task structure and reasoning demands.

It recommends reporting accuracy alongside ICC and within-query variance.

Visible repo:

github.com/youdotcom-osy/stochastic-agent-evals

Exact URL uncertain due to blur.

### Signal

High-value evidence slide.

Academic backing for the instinct that agent evals are fragile.

Operational claim:

Do not trust single-run leaderboard numbers. Measure repeatability.

---

## 20260504_142042.jpg

### Visible text

DataRobot

Agent demos are everywhere.  
Production ROI is not.

The gap isn’t the model, the framework, or the prompt.  
It’s everything below the waterline.

### Signal

Probably the best DataRobot thesis slide.

Conference-wide pattern:

Demos are abundant. Production substrate is scarce.

---

## 20260504_142129.jpg

### Visible text

From prototype to production, 80% of engineering effort goes to the 30% nobody puts in the demo.

PRODUCTION REALITY

*95%

Production data, not samples

Reliability under scale and failure

Unit economics that survive growth

Audit, observability, governance

### Uncertainty

The “*95%” meaning is not fully visible. Treat as caveated.

### Signal

Excellent anti-demo slide.

Stronger usable point:

Production reality is production data, reliability, economics, audit, observability, and governance.

---

## 20260504_142252.jpg / 20260504_142606.jpg

### Visible text

DataRobot

Enterprise readiness isn’t one feature.  
It’s a stack.

Pillar 1: Developer Experience

Continuous Improvement

Trace analysis & remediation  
Find the failure mode; fix it without redeploying the world.

A/B testing for prompt variations  
Measure changes empirically, not anecdotally.

Performance regression detection  
Catch quality drops before customers do.

Cost management  
Tokens, compute, memory — visible and budgeted.

Enterprise Integration

CI/CD for agent deployments  
Promote agents the way you promote services.

Observability & debugging  
Reproduce production behavior locally — and at scale.

OAuth & production data connectors  
Real systems, real auth, real data — not shims or samples.

Standardized auth, logging, error patterns  
One pattern across every agent in the portfolio.

### Signal

Concrete implementation list.

The platform story is not about one magical runtime.

It is:

CI/CD

Observability

Auth

Connectors

Logging

Regression detection

Cost management

---

## 20260504_142716.jpg

### Visible text

“works for me” is 20% of the journey.  
“works for everyone” is the rest.

Make enterprise readiness a platform capability — not a project.  
Developers write the agent; the platform adds the rest.

Augment, don’t rewrite  
Bring existing agent code; the platform layers in trace analysis, A/B testing, observability, and [text partly cut off].

One pattern, every agent  
Auth, logging, error handling, CI/CD — configured once, reused across the portfolio.

Time-to-enterprise-ready measured in days, not quarters  
The non-functional work stops being the gating step on every release.

### Signal

Enterprise platform thesis in one slide.

Common substrate beats each team inventing its own production harness.

---

## 20260504_142805.jpg

### Visible text

DataRobot

Static API keys aren’t an identity model.

Your IAM stack was designed for users and services. Agents are neither — [text partly cut off]

[today?] rely on shared credentials with no auditable chain of custody.

THE PROBLEM

The default is a god-mode API key  
To run autonomously, every agent gets a broadly-scoped, long-lived credential. One compromise, and [cut off].

No subject vs. actor distinction  
When the agent acts on a user’s behalf, “who triggered this?” and “who executed this?” collapse into [cut off].

Authorization is binary, not contextual  
The intersection of user privileges and agent scopes is invisible — so your security review becomes [cut off].

### Signal

Strong identity slide.

Distinguishes user, service, and agent identity.

Key production problem:

Static keys erase chain of custody and collapse “subject” versus “actor.”

---

## 20260504_145824.jpg

### Visible text

DataRobot

Pillar 2: Agent Identity

Treat agents as first-class identities. Chain authority.  
Audit every hop.

The principles — together, they let you put agents in production without breaking your security review.

THE SOLUTION

First-class agent identity  
Every agent gets a real OAuth identity in the directory — never a static API key.

Zero-Trust Token Chaining  
Tokens distinguish Subject, sub — who triggered, from Actor, act — who executed, at every hop.

Intersection Authorization  
Effective permissions are computed dynamically as the strict intersection of user and agent scopes.

Formula-ish line visible:

Authz(sub) ∩ Authz(act) — computed dynamically at every hop

Dual IDP Integration  
Bring your own — Okta, Entra ID, or use DataRobot’s native authorization server.

Immutable Audit Lineage  
Recursive act-claim wrapping creates a tamper-proof breadcrumb trail for every action.

### Signal

Direct match for synthetic capability / delegated authority model.

Production agents need:

Chained identity

Intersected permissions

No shared service accounts

No static API key

---

## 20260504_145830.jpg

### Visible text

DataRobot

Agents are tightly coupled to GPUs.  
Margins disappear at scale.

Apps are pinned to specific inference engines. Fine for a proof of concept. Fatal [cut off].

THE PROBLEM

Best-effort inference, unpredictable cost  
Token consumption swings with prompt length, retries, and tool calls — finance can’t model the unit economics.

Scale exposes the coupling  
GPU failures, partial scaling, autoscaling metrics — every fix requires deep infra knowledge.

No price/SLA tiering  
Every request pays the premium price even when low-priority work could ride spot capacity.

### Signal

Economic version of the below-waterline argument.

Key idea:

Decouple user/product contracts from backend inference mechanics.

Finance cannot model agent systems if token use, retries, and GPU coupling are uncontrolled.

---

## 20260504_150032.jpg

### Visible text

DataRobot

Pillar 3: Token Factory Economics

Decouple user contracts from backend execution.  
Run a token factory.

Treat inference capacity — not the GPU — as the resource you allocate.

THE SOLUTION

Token pools with deterministic admission control  
Capacity is granted or rejected before traffic flows. No throttling surprises in production.

Premium and spot tiers  
SLA-bound traffic pays a premium price; low-priority work runs on heavily discounted spot tokens.

Reshape worker topology without breaking contracts  
GPUs and engines change underneath. The contract — and the SLO — stays stable.

### Signal

Strong architecture / economics slide.

“Token factory” is an abstraction layer over model/vendor/GPU execution.

Inference becomes allocatable capacity with:

Admission control

Tiers

SLO protection

Cost predictability

---

## Batch 2 raw synthesis

DataRobot’s talk was not really about agents. It was about the missing production substrate beneath agents: identity, governance, observability, evals, CI/CD, production data access, and token economics.

The repeated pattern:

Demos prove behavior.

Platforms make behavior survivable.

Static API keys, bespoke auth, invisible costs, and GPU-coupled execution all break when agents move from prototype to production.

Proposed answer:

Shared enterprise layer

First-class agent identity

Chained authority

Intersected authorization

Immutable audit lineage

Deterministic admission control

Token pools with premium / spot economics

---

# Batch 3

## 20260505_101406(1).jpg

Duplicate of earlier banking slide.

### Visible text

What’s blocking the transition to agentic banking systems

Fragmented agentic stacks hinder real delivery  
→ Apps and AI agents together in one integrated experience & lifecycle

Tension between regulations and AI disruption  
→ Agentic architectures with security, auditability, and compliance baked in

Core banking systems paralyze innovation  
→ A way to wrap that core to get agility without risking stability

### Signal

Regulated-industry version of the conference theme.

Do not replace the core.

Wrap it with governed agentic capability.

---

## 20260505_114307.jpg

### Visible text

The road to autonomous agents

Timeline:

2024  
Code completion

Early 2025  
Vibe Coding

May 2025-now  
Coding Agents in production

2026–2027  
Autonomous Agents working in the background

### Signal

Hype-roadmap slide.

Useful as chronology, but treat as vendor forecast, not fact.

Frames “background autonomous agents” as the next phase after coding agents in production.

---

## 20260505_115251.jpg

### Visible text

Git for data: treat data like code

Prompt:

“Import this new data from s3://source/data.parquet

Then, rebuild the pipeline for the marketing team to understand engagement metrics for social media so that is now factors in this new additional source”

Diagram elements:

Human

AI agent

Skills

main

agent.feature_br

Review and merge

Existing table 1 / 2 / 3

New table / New table 1 / New table 2

New table 1 / New table 2 / Existing table 3 after review

### Signal

Agentic data engineering workflow.

Key idea:

Branch / PR semantics for data and pipeline changes.

Agent proposes data mutations in an isolated branch.

Human reviews.

Then merge.

This turns data work into auditable software delivery, not ad hoc warehouse surgery.

---

## 20260505_115605.jpg

### Visible text

Use case deep dive

Customer: Leading property-management software in the US providing leasing, payments, accounting, pricing, and analytics.

~$1.9B revenue

~4,500 employees

Today’s tech stack:

BigQuery Warehouse

Alteryx Transformation and ETL

Databricks DS and Pipelines

Tableau BI and Dashboards

Stated target:

90% agent-driven development.  
Humans only validate through Claude Code.

### Signal

Strong but probably marketing-heavy.

Useful as extreme claim:

Data / analytics pipeline modernization with agents doing most implementation, humans validating.

Claude Code explicitly appears as the validation interface.

---

## 20260505_144848.jpg

### Visible text

What agents actually do

Every agent action = API calls + database transactions

10,000 humans pauses, peaks, valleys — the database breathes

10,000 agents: continuous, exhaustive, every millisecond utilized

Agent populations compound: 50K → 250K → ...

Exhaustive query patterns create compounding load on backend systems

Footer gist:

State of AI Infrastructure 2026: DB identity AI agents as a critical driver of data-infrastructure strategy, #1 challenge cost and performance at scale.

### Signal

Excellent infrastructure slide.

Agents do not merely “use apps.”

They hammer APIs and databases.

Human traffic is bursty and has rest.

Agent traffic is continuous, exhaustive, and multiplicative.

---

## 20260505_145000.jpg

### Visible text

What this looks like in practice

10,000 humans

Intermittent, session-based queries

Natural pauses — reading, thinking, clicking

Peak hours, off-peak hours, weekends

vs

10,000 agents

Continuous, exhaustive query patterns

No pauses — every millisecond is utilized

24/7/365 at machine speed, compounding as populations grow

### Signal

Clean visual articulation:

Humans breathe.

Agents don’t.

This should go in the final synthesis.

One of the strongest operational lessons.

---

## 20260505_151015.jpg

### Visible text

39-point speed perception gap  
between felt speed and measured speed

Embedded chart title:

Against Expert Forecasts and Developer Self-Reports, Early-2025 AI Slows Down Experienced Open-Source Developers

AI Slows Down Experienced Open-Source Developers

METR logo visible.

Chart categories visible:

Economist expert forecasts

ML expert forecasts

Developer forecasts during study

Developer estimates after study

Observed result

### Signal

Reality-check slide.

Contrasts perceived productivity gains with measured outcomes.

Important synthesis point:

Agent velocity is not self-validating.

Subjective acceleration can diverge sharply from actual throughput.

---

## 20260505_151956.jpg

### Visible text

The bottleneck migrated  
from code generation to code validation

Diagram:

AI-Assisted Inner Loop:

High-Volume Patches

AI-Generated Code

Debug

Build

Bottleneck Outer Loop:

Tests

Deploy

Queue

Manual Review

Compliance

Security

Slow Feedback / Noisy Signal

### Signal

One of the best slides in all batches.

Matches repo-history / provenance / agentic-development concern.

AI accelerates patch generation.

Organizational bottleneck moves to:

Validation

Review

Security

Compliance

Deployment

Fast inner loop.

Slow outer loop.

---

## 20260505_161706.jpg / 20260505_161718.jpg

### Visible text

The agent readiness scorecard.

Subtitle:

Where are you on each layer? Be honest — most teams in this room are blind on data and reactive on agents.

Columns:

Layer

Sub-components

Level 1: Blind

Level 2: Reactive

Level 3: Production-Grade

Rows:

01 Data Layer  
Freshness, volume, schema, distribution

Level 1: No monitoring on AI workloads. Assume it’s fine.

Level 2: Some warehouse alerts. Disconnected from agent failures.

Level 3: End-to-end lineage from agent output to source. Auto-circuit-break on data incidents.

02 Semantic Layer  
RAG, embeddings, vector store, metadata

Level 1: Built once, never observed. No refresh cadence.

Level 2: Periodic re-embedding. Spot checks on retrieval quality.

Level 3: Embedding drift monitors. Retrieval quality alerts. Auto-refresh on stale docs.

03 Agent-Build Layer  
Orchestration, tool use, multi-agent, guardrails

Level 1: No tracing. Reading logs line by line. Single-platform bet.

Level 2: Some logging. Manual review of failed runs. Basic guardrails.

Level 3: Tool-call traces. Behavior anomaly alerts. Multi-builder architecture with accountability.

04 Trust Layer  
Traces, evaluations, alert routing, agentic-first approach

Level 1: No observability across layers. Find out when agents go rogue.

Level 2: Siloed monitoring per layer. No connection between data issues and agent failures.

Level 3: Unified observability across all four layers. Input-to-output lineage. Agentic based troubleshooting and resolution.

### Signal

Very useful framework.

Separates production maturity into:

Data layer

Semantic / RAG layer

Agent-build layer

Trust / observability layer

Production-grade means:

Lineage

Drift detection

Traces

Anomaly alerts

Cross-layer observability

---

## 20260505_162032.jpg

### Visible text

AI Agent Conference 2026

The Thin Line Between Magic and Tragic: Getting MCP’s Right

Panelists:

Alex Salazar  
Cofounder & CEO  
Arcade  
Host

Prerit Munjal  
Senior Technical Product Manager  
Groupon

Ralph Bird  
Principal Machine Learning Engineer  
PagerDuty

Ze’ev Klapow  
Principal Software Engineer  
HubSpot

### Signal

MCP panel title slide.

Important mostly for attribution / context.

“Magic vs tragic” is a good shorthand for MCP:

It can unlock agents.

Or expose unsafe, chaotic tool surfaces.

---

## 20260505_164221.jpg

### Visible text

The Bright Line  
When Do Agents Earn Their Complexity Cost?

Deterministic Systems:

Downloading and normalizing market data

Computing signals from a defined strategy

Executing trades against a rulebook

Order management and position reconciliation

Agentic Systems:

Generating hypotheses for why a strategy is underperforming

Designing and evaluating new trading strategies

Deciding which research direction to pursue next

Evaluating whether a strategy’s edge is decaying or structural

Bottom line:

If a task has a known procedure and predictable output, it doesn’t need an agent. It needs a well-engineered pipeline.

### Signal

Extremely strong.

Clearest agent-selection rule so far.

Agents earn their keep only when ambiguity, judgment, hypothesis generation, or strategy exploration is central.

Known-procedure work belongs in deterministic systems.

---

## 20260505_164539.jpg

### Visible text

One Agent Per Asset Class × Strategy

Columns:

Equities

Fixed Income

Commodities

Currencies

Rows:

Momentum

Mean Reversion

Carry

Volatility

Robot icons occupy combinations across the matrix.

Footer:

Each agent = one quant researcher

Owns a strategy end-to-end:

implement → backtest → evaluate → improve → deploy

It’s a quant trading research workforce of AI agents.

### Signal

Agent swarm application model.

Each agent has a bounded research mandate.

Not arbitrary autonomy.

Specialized agents with explicit mandate surfaces.

---

## 20260505_164557.jpg

### Visible text

Swarm Architecture  
Two layers, one boundary

Top layer:

Swarm-Level Reflection

Mandates

Equity Momentum Agent

FX Carry Agent

Commodity Trend Agent

Head of Research

Performance

Middle boundary:

Strategy Deployment Boundary

Validated strategies cross this line into production

Bottom deterministic pipeline:

Data Ingestion → Signal Computation → Order Management → Trade Execution

Footer:

No agents here. Deterministic pipeline.

### Signal

High-value architecture slide.

Separates agentic research / reflection from deterministic production execution.

Agents generate, evaluate, and refine strategies above the boundary.

Validated outputs cross into production.

Execution remains deterministic.

---

## Batch 3 raw synthesis

This batch sharpens the real architecture.

The credible pattern is not “agents everywhere.”

It is bounded agents above deterministic systems.

Agents are useful where the work is ambiguous:

Hypothesis generation

Research direction

Strategy design

Evaluation

Adaptation

They are not appropriate for known-procedure systems:

Data ingestion

Signal computation

Order management

Trade execution

The deepest theme is boundary placement.

One slide says the bottleneck moved from code generation to validation.

Another says humans breathe but agents hammer infrastructure continuously.

Another says production-grade readiness requires lineage across data, semantic retrieval, agent behavior, and trust layers.

Strongest architecture:

Agents operate in bounded research or development loops.

Validated outputs cross a deployment boundary.

Production systems remain deterministic, observable, audited, and reversible.

---

# Cross-Batch Raw Observations

## Repeated claims

Agent demos are everywhere. Production ROI is not.

The gap is not the model, the framework, or the prompt.

The gap is infrastructure below the waterline.

Vector databases are insufficient by themselves.

Static API keys are not an identity model.

Agents create continuous backend load.

Humans have natural pauses. Agents do not.

AI accelerates code generation, but validation becomes the bottleneck.

Production-grade agents require lineage, identity, observability, evals, and cost control.

Known procedures do not need agents. They need deterministic pipelines.

## Strong phrases captured

Production agents still need very non-magical systems.

A vector database isn’t enough for agents.

Agent demos are everywhere. Production ROI is not.

It’s everything below the waterline.

Static API keys aren’t an identity model.

Treat agents as first-class identities. Chain authority. Audit every hop.

Token Factory Economics.

Treat inference capacity — not the GPU — as the resource you allocate.

The bottleneck migrated from code generation to code validation.

Humans breathe. Agents don’t.

If a task has a known procedure and predictable output, it doesn’t need an agent. It needs a well-engineered pipeline.

No agents here. Deterministic pipeline.

## Raw architecture pattern

Agentic layer:

Research

Hypothesis generation

Strategy exploration

Prompt variation

Retrieval / semantic reasoning

Agent-build experimentation

Reflection

Evaluation

Deterministic layer:

Data ingestion

Normalization

Signal computation

Order management

Trade execution

Production deployment

Stable APIs

Audited workflows

Boundary:

Validated strategies / outputs cross into production.

Agents should not directly mutate or execute core production pathways without governed deployment boundaries.

## Raw enterprise-readiness stack

Data layer:

Freshness

Volume

Schema

Distribution

Lineage

Auto-circuit-break on data incidents

Semantic layer:

RAG

Embeddings

Vector store

Metadata

Embedding drift

Retrieval quality

Auto-refresh on stale docs

Agent-build layer:

Orchestration

Tool use

Multi-agent behavior

Guardrails

Tool-call traces

Behavior anomaly alerts

Multi-builder accountability

Trust layer:

Traces

Evaluations

Alert routing

Cross-layer observability

Input-to-output lineage

Agentic troubleshooting and resolution

## Raw governance / identity stack

First-class agent identity

OAuth identity in directory

No static API keys

No shared service accounts

Subject / actor distinction

Zero-trust token chaining

Intersection authorization

Authz(subject) ∩ Authz(actor)

Dual IDP integration

Immutable audit lineage

Recursive act-claim wrapping

Audit every hop

## Raw economics stack

Token pools

Deterministic admission control

Premium tiers

Spot tiers

Stable SLAs

SLO preservation

Inference capacity as allocated resource

Decouple user contracts from backend execution

Decouple apps from specific inference engines

Avoid GPU-coupled product contracts

Finance needs modelable unit economics

Token consumption swings with prompt length, retries, and tool calls

## Raw eval / measurement stack

Single-run evals are suspect.

Agentic evaluation is stochastic.

Repeatability matters.

ICC proposed as stability metric.

Accuracy alone is insufficient.

Within-query variance matters.

Subjective speed and measured speed can diverge.

Agent velocity is not self-validating.

The bottleneck can move rather than disappear.

## Raw skepticism / caution

Vendor roadmaps are forecasts, not facts.

“90% agent-driven development” is likely marketing-heavy, but still useful as directional signal.

Agent swarms only make sense with bounded mandates.

Agent autonomy without boundaries is not architecture.

MCP is magic or tragic depending on tool-surface design.

Production agent systems are not prompt engineering. They are platform engineering.

## Raw final thesis from images

The conference’s strongest signal is not that agents are ready to take over production systems.

The stronger signal is that production agent systems require a governed substrate:

Identity

Lineage

Retrieval provenance

Evaluation repeatability

CI/CD

Observability

Cost controls

Token economics

Deterministic deployment boundaries

Agentic work belongs above the boundary where ambiguity and judgment live.

Deterministic work remains below the boundary where reliability, auditability, and repeatability matter.

The winning architecture is not “agents everywhere.”

It is agents where they earn their complexity cost, wrapped by production-grade platform controls, and prevented from dissolving the deterministic systems that still carry the business.
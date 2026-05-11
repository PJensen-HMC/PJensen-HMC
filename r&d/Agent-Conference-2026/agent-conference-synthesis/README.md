# Agent Conference 2026

This workspace turns the Agent Conference 2026 firehose into HMC-facing operational intelligence.

It is both a conference record and a source-backed synthesis pipeline: raw field capture stays raw, normalized indexes preserve provenance, extracted claims keep the evidence honest, analysis turns claims into meaning, and delivery artifacts package the result for different audiences.

## The Read

Agent Conference 2026 did not validate a simple "agents everywhere" roadmap.

The strongest signal was a production architecture: agents are non-human actors that need explicit identity, delegated authority, governed capabilities, provenance-aware context, validation, observability, infrastructure controls, and human review.

The HMC move is not to expose APIs to a clever chatbot. The HMC move is to build the control plane that lets non-human actors act safely, measurably, and economically.

In local language: agents need cockpits, not keys to the building.

## Start Here

| Need | Read |
| --- | --- |
| Fast executive read | [`05_outputs/agent-conference-2026-everything-distilled.md`](05_outputs/agent-conference-2026-everything-distilled.md) |
| Chronological field story | [`06_delivery/STORY.md`](06_delivery/STORY.md) |
| Full source-backed packet | [`05_outputs/agent-conference-2026-everything.md`](05_outputs/agent-conference-2026-everything.md) |
| Deep architecture memo | [`05_outputs/agent-conference-2026-patterns.md`](05_outputs/agent-conference-2026-patterns.md) |
| Interactive presentation layer | [`06_delivery/agent-conference-2026-microsite.html`](06_delivery/agent-conference-2026-microsite.html) |
| Delivery order | [`06_delivery/README.md`](06_delivery/README.md) |
| Evidence inventory | [`MANIFEST.md`](MANIFEST.md) |
| Source spine | [`02_normalized/source-ledger.md`](02_normalized/source-ledger.md) |

## Interesting Entry Points

Use these when you want a stronger door into the material than "read the whole thing."

| Trail | Entry points |
| --- | --- |
| Story-first | [`Day 1: Entering In A Bad Mood`](06_delivery/STORY.md#day-1-entering-in-a-bad-mood), [`Datadog: Observability Becomes A World Model`](06_delivery/STORY.md#datadog-observability-becomes-a-world-model), [`Apollo: The Cockpit Line`](06_delivery/STORY.md#apollo-the-cockpit-line), [`NVIDIA: The Favorite Talk`](06_delivery/STORY.md#nvidia-the-favorite-talk), [`RingCentral: The Final Architecture Click`](06_delivery/STORY.md#ringcentral-the-final-architecture-click) |
| Architecture-first | [`The Pattern`](05_outputs/agent-conference-2026-everything-distilled.md#the-pattern), [`What Carries Forward`](05_outputs/agent-conference-2026-everything-distilled.md#what-carries-forward), [`HMC Reference Architecture`](05_outputs/agent-conference-2026-patterns.md#hmc-reference-architecture), [`Recommended Next Steps`](05_outputs/agent-conference-2026-patterns.md#recommended-next-steps) |
| Capability-surface thread | [`The API layer is becoming the agent layer`](04_analysis/day2-synthesis.md#1-the-api-layer-is-becoming-the-agent-layer), [`The Agent Layer Is A Mediated Capability Layer`](05_outputs/agent-conference-2026-patterns.md#1-the-agent-layer-is-a-mediated-capability-layer), [`Step 2: Build A Minimal Capability Registry`](05_outputs/agent-conference-2026-patterns.md#step-2-build-a-minimal-capability-registry) |
| Governance and risk thread | [`Day 1 Security And Evals`](06_delivery/STORY.md#day-1-security-and-evals-the-gateway-emerges), [`MCP Panel: Connection Is Not Governance`](06_delivery/STORY.md#mcp-panel-connection-is-not-governance), [`Claims Requiring Verification`](05_outputs/agent-conference-2026-patterns.md#claims-requiring-verification-before-leadership-use), [`Caveats`](05_outputs/agent-conference-2026-everything-distilled.md#caveats) |
| Validation thread | [`NVIDIA: Research, Gates, And Sweeps`](05_outputs/agent-conference-2026-patterns.md#nvidia-research-gates-and-sweeps-are-the-operating-model), [`CircleCI / METR: Speed Is Not Throughput`](06_delivery/STORY.md#circleci--metr-speed-is-not-throughput), [`Validation Is Now The Bottleneck`](05_outputs/agent-conference-2026-patterns.md#5-validation-is-now-the-bottleneck) |
| Evidence-first | [`Source ledger`](02_normalized/source-ledger.md), [`Day 1 timeline`](02_normalized/day1-timeline.md), [`Day 2 timeline`](02_normalized/day2-timeline.md), [`Claim traceability`](05_outputs/agent-conference-2026-everything-distilled.md#appendix-b-claim-traceability), [`Image/OCR index`](02_normalized/image-index.md) |

High-signal field-story doors:

- [`Afternoon Day 1: Below The Waterline`](06_delivery/STORY.md#afternoon-day-1-below-the-waterline)
- [`Coding Agents: The Review Wall Appears`](06_delivery/STORY.md#coding-agents-the-review-wall-appears)
- [`Bauplan: Let Agents Fail Somewhere Safe`](06_delivery/STORY.md#bauplan-let-agents-fail-somewhere-safe)
- [`Google: Do Not Send One Model Wandering Around The Market`](06_delivery/STORY.md#google-do-not-send-one-model-wandering-around-the-market)
- [`CockroachDB: Humans Breathe. Agents Do Not.`](06_delivery/STORY.md#cockroachdb-humans-breathe-agents-do-not)
- [`Monte Carlo: Bad Agent Answers Can Be Data Failures`](06_delivery/STORY.md#monte-carlo-bad-agent-answers-can-be-data-failures)
- [`After The Conference: The Pair Becomes The Product`](06_delivery/STORY.md#after-the-conference-the-pair-becomes-the-product)

## What This Is

This is not a loose notes folder.

It is a staged research artifact:

1. Preserve the raw conference capture.
2. Normalize sources into a traceable ledger.
3. Extract claims before interpreting them.
4. Separate analysis from evidence.
5. Produce leadership and architecture artifacts.
6. Keep the delivery layer thin so final documents do not drift into duplicate copies.

The working rule is processing state first, source identity second, theme last.

## Conference Through-Line

The conference started from skepticism: look for mechanism under agent hype, leave weak sessions quickly, and preserve attention for talks with operating detail.

Day 1 moved the signal away from chatbots and toward production substrate:

- Datadog made observability look like an operational world model.
- Glean and similar adoption talks pointed toward toil-first use cases.
- CrewAI and Agent OS material reinforced embedded workflows, skills, and repeatable procedures.
- LanceDB and You.com made context feel like infrastructure, not a RAG checkbox.
- DataRobot put the below-waterline product in view: identity, auth, audit, evals, governance, observability, CI/CD, connectors, and economics.
- Security and eval talks made the gateway unavoidable: prompt injection will happen, and today's evals become tomorrow's guardrails.

Day 2 sharpened the operating model:

- T-Mobile, Distyl, and banking material exposed the moral edge: the same substrate can reduce toil or become containment and surveillance.
- Apollo gave the cockpit metaphor: expose governed controls, not the whole machine.
- Bauplan made safe failure surfaces concrete for data agents.
- NVIDIA made Research, Gates, and Sweeps vivid as a way to absorb AI velocity without rotting validation.
- CockroachDB warned that humans breathe and agents do not.
- CircleCI, METR, and Monte Carlo clarified the validation and trust bottlenecks.
- The MCP panel made connection sprawl and destructive-action policy impossible to ignore.
- RingCentral closed the loop: not everything needs to be an agent; deterministic systems should execute known procedures.

The final architecture clicked into place: specialize the agents, govern the capabilities, and keep execution deterministic where it can be.

## Durable Patterns

These are the conference patterns worth carrying forward:

- Agents are actors, not users.
- Capabilities matter more than endpoints.
- Context is infrastructure.
- Validation is the bottleneck after generation accelerates.
- Domain rules are scarcer than tokens.
- Evals become guardrails.
- Gateways are where prompt injection, tool exposure, audit, DLP, and destructive-action policy meet.
- Data agents need safe failure surfaces before they touch authoritative state.
- Human review has to evolve from reading every diff to consuming distilled signals.
- Use-case selection is moral architecture.

## HMC Implications

The strategic design unit should be the governed capability surface.

A capability is not just an endpoint. It is a named action with typed input, typed output, known side effect, owner, policy, actor constraints, audit events, criticality classification, and rollback or compensation behavior.

Near-term HMC moves:

- Pick one bounded toil pilot with a named owner, measurable success criteria, and small blast radius.
- Start in read-only or proposal-first mode.
- Define a capability registry standard before pilots multiply.
- Separate human subject, agent actor, delegated authority, tool invocation, and system of record.
- Treat context provenance as platform infrastructure.
- Turn evals into gates, sweeps, replay, and incident-response loops.
- Capture SME rules as durable skills, procedures, policies, fixtures, and capability definitions.
- Measure control-plane maturity, not agent novelty.

## Workspace Map

| Stage | Path | Purpose |
| --- | --- | --- |
| Raw evidence | [`01_raw-evidence/`](01_raw-evidence/) | Untouched artifacts: notes, chat exports, transcripts, images, OCR, booth notes. |
| Normalized indexes | [`02_normalized/`](02_normalized/) | Source ledger, timelines, audio/image/booth indexes, cleaned references. |
| Extracted claims | [`03_extracted-claims/`](03_extracted-claims/) | What sources actually say, keyed for downstream traceability. |
| Analysis | [`04_analysis/`](04_analysis/) | What the claims likely mean, separated from raw evidence. |
| Outputs | [`05_outputs/`](05_outputs/) | Executive and architecture artifacts. |
| Delivery | [`06_delivery/`](06_delivery/) | Delivery order, field story, and microsite. |

## Primary Artifacts

| Artifact | Audience | Use |
| --- | --- | --- |
| [`agent-conference-2026-everything-distilled.md`](05_outputs/agent-conference-2026-everything-distilled.md) | Leadership | Send first. Shortest clean executive read. |
| [`agent-conference-2026-everything.md`](05_outputs/agent-conference-2026-everything.md) | Leadership plus follow-up readers | Fuller packet with field signals, people, company links, caveats, and traceability. |
| [`agent-conference-2026-patterns.md`](05_outputs/agent-conference-2026-patterns.md) | AI, platform, security, architecture | Internal deep dive. Strong substrate for follow-up design work. |
| [`STORY.md`](06_delivery/STORY.md) | Anyone who needs the human path | Chronological field narrative behind the polished artifacts. |
| [`agent-conference-2026-microsite.html`](06_delivery/agent-conference-2026-microsite.html) | Presentation / interactive readout | Microsite view of the thesis, patterns, field signals, pilots, caveats, and source spine. |

## Field Signals

These are signals, not endorsements.

| Signal | Why It Matters |
| --- | --- |
| Apollo | API descriptions can become mediated capabilities if schema, identity, runtime boundary, audit, and replay surround them. |
| NVIDIA | CLI-native internal tools, harnesses, Research, Gates, and Sweeps made the validation model concrete. |
| RingCentral | Agents should reason, research, reflect, and propose; deterministic systems should execute, enforce, measure, and audit. |
| DataRobot | The production product is below the waterline: governance, evals, observability, auth, connectors, CI/CD, and economics. |
| Datadog | Observability data can become an agent-visible operational world model. |
| LanceDB / You.com | Context is a workload with provenance, latency, metadata scale, and budget pressure. |
| Bauplan | Data agents need branches, deltas, checks, lineage, review, and controlled promotion. |
| MCP panel | Connection standards are not security models. Tool sprawl and destructive actions need policy. |
| CockroachDB | Agent-shaped traffic changes database, API, queue, auth, CI, observability, and cost assumptions. |
| Monte Carlo | Bad agent answers can be upstream data, semantic, build, or trust failures. |
| T-Mobile / Distyl | Agency can become containment if use-case incentives are wrong. |

## Evidence Model

The evidence path should be:

```text
raw source -> source ledger -> extracted claim -> analysis -> output
```

Use the normalized source ledger as the spine:

- [`02_normalized/source-ledger.md`](02_normalized/source-ledger.md)
- [`02_normalized/day1-timeline.md`](02_normalized/day1-timeline.md)
- [`02_normalized/day2-timeline.md`](02_normalized/day2-timeline.md)
- [`02_normalized/image-index.md`](02_normalized/image-index.md)
- [`02_normalized/audio-index.md`](02_normalized/audio-index.md)
- [`02_normalized/booth-index.md`](02_normalized/booth-index.md)

Use extracted claim IDs when promoting conference material into analysis or outputs:

- [`03_extracted-claims/day1-claims.md`](03_extracted-claims/day1-claims.md)
- [`03_extracted-claims/day2-claims.md`](03_extracted-claims/day2-claims.md)
- [`03_extracted-claims/vendor-claims.md`](03_extracted-claims/vendor-claims.md)
- [`03_extracted-claims/slide-claims.md`](03_extracted-claims/slide-claims.md)

Do not cite an output artifact as if it were raw evidence. Trace the claim back through the claim layer and source ledger.

## Caveats

- Vendor and product references are field signals, not procurement recommendations.
- NVIDIA CLI adoption details are note-backed, not audio-backed in the current corpus.
- The LanceDB "1B tables" anecdote is preserved in raw notes, but exact attribution remains unverified.
- OCR-backed slide wording should be checked before quotation.
- Noisy exhibit-hall captures should stay out of leadership material unless separately reviewed.
- The governed capability-surface recommendation is an HMC interpretation of the conference pattern, not a direct conference claim.

## Maintenance Rules

- Raw evidence stays raw.
- Put new source inventory or reconciliation work in `02_normalized/`.
- Put source-level claims in `03_extracted-claims/`.
- Put interpretation in `04_analysis/`.
- Put polished artifacts in `05_outputs/`.
- Keep `06_delivery/` as delivery guidance and presentation surface, not a second canonical output tree.
- Preserve source traceability when tightening language.
- Keep caveats visible when claims are note-backed, OCR-backed, vendor-positioned, or otherwise unverified.

## Lines Worth Repeating

> Agents need cockpits, not keys to the building.

> Build the control plane, not the magic trick.

> The scarce resource is not tokens. It is domain rules.

> Today's evals are tomorrow's guardrails.

> Prompt injection will happen. Design the gateway.

> Humans breathe. Agents do not.

> Specialize the agents. Govern the capabilities. Keep execution deterministic where it can be.

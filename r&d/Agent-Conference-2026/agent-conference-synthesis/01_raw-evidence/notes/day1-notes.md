Okay, I'm starting the Agent Conference 2026. I'm going in a huge skeptic. I'll be sampling
the talks and moving through them quickly, looking for high signal and leaving if there's
a lot of noise or unspecified behavior or whatever.

I did not use my laptop on the first day and so `day1-chat-export.pdf` has the raw notes; 
worked backwards from the PDF to harvest the raw notes below.
+==========================================================

# Day 1 Raw Reconstruction — Trace Buffer

Purpose: recover Pete's raw Day 1 signal capture, reactions, hypotheses, and emotional/technical responses from the conversation stream with minimal cleanup.

Method:

* Preserve fragmented/raw phrasing where possible
* Separate observation from synthesis
* Keep rough chronological flow
* Add trace markers approximating conversation order/time
* Avoid over-normalizing language

---

# Operating Frame

"I’m not here to attend talks politely. I’m here to sample fast, detect whether there is a real system underneath the claims, extract constraints/evals/failure modes, and leave the moment it turns into vapor."

Flow:
0–3 min → decide
5 min → leave unless real
Take photos of any dense slide
Don’t overtype — just anchors

Capture:
[TALK]
System:
Constraint:
Eval:
Verdict:

Mission:
3 patterns
2 gaps
1 sharp take

---

# TRACE BUFFER

## [Approx 8:00–9:00 AM] — Pre-Conference Mental Model

"I feel like I'm in the perfect bad mood, feeling skeptical."

Observations:

* Preserve attention
* Depth > breadth
* Looking for structure, not networking
* Laptop potentially drag
* Audio recorder possibly more useful than typing

Realization:

* Use recorder as post-talk compression layer
* Phone notes should remain anchors only

---

## [Opening Talk] — Datadog / Observability / World Models

Chief scientist of Datadog.

Past:

* dashboards

Current:

* devops loop
* trillions of traces
* exabytes of logs
* observability data

Modeling:

* "world model"
* time series
* topology
* events
* alerts
* metrics
* proactive prediction

"A world model allows you to ask what-if questions."

750B datapoints.

Benchmarks:

* "Toto" on HuggingFace
* timeseries + text
* timeseries question answering

Internal evals are CRUCIAL.

Recording workflows.
Hill climbing.
More diverse sources = flywheel.

Frontier models too expensive.
Latency.

Reaction:
"Question: I wonder if this can be used for financial modeling."

Key reaction:

* observability becoming predictive substrate
* workflows themselves becoming training/eval assets

---

## [Sapphire Ventures]

Clarified assistant vs agent.

"Doing real work for you."

Enterprise:

* companies won't be able to just jump in
* same evolution as coding

Governance.
Observability.
Determinism.

"Go for toil."

Financial analyst example.

Enterprises need to LEARN.
"0th inning."

Interesting:

* build your own harness?
* cost will balloon
* models are the new operating systems
* OSS models important for enterprise

Consumer vs enterprise split.

ARR per engineer going up.

"AI native is a different business model."

Need very strong management teams.

Themes:

* middleware
* agentic apps
* Temporal
* EliseAI

Reaction:

* infra + orchestration > single models
* OSS + optionality emerging early

---

## [CrewAI]

"Buddy is excited."

Agentic transformation.
Commoditization.

Hard parts:

* deployment
* scaling

Started as open source.
Opinionated.

Internal stories.
Slack assistant.
"Iris"
43% AI authored.

Whitepaper generation.
Agent executions per quarter.

Two kinds of systems:

1. ad hoc workflows
2. embedded workflows

RAW TAKE:
"This is where I want to be."

RAW TAKE:
a) anything you do other product can do
b) you MUST have a flywheel
c) building blocks -- internal applications
d) agents should have their own repository
e) a repository for skills
f) encode how you make decisions

Reaction:

* workflow distinction meaningful
* embedded workflows seem durable
* infra + reusable capability surfaces matter more than single apps

---

## [UiPath]

G2 Chief Innovation Officer.

RAW TAKE:
"Paradox: agents needed more oversight as autonomy increases."

Understanding goals.
Workflow.
Context.

"Process orchestration."

Reliability.
Resiliency.

Throwing around determinism.

Mixed fleet of software.

"Pile of MCP is not enough."

RAW REACTION:
"I could not agree more -- its about process orchestration -- not a swarm."

RAW REACTION:
"They're throwing around determinism a lot -- but they have not explained how."

Reaction:

* orchestration layer matters
* determinism being used vaguely
* not enough mechanism
* orchestration > swarm rhetoric

---

## [Fetch.ai]

Trip booked by an agent.

"Too cute."

Agents as value creators.

Reaction:

* low signal
* consumer fluff

---

## [LanceDB]

CEO/co-founder.
Pandas co-author.

Interesting opener:

* agents in China
* popularity

"No external service — everything under one roof."

Semantic.
Vector.
Memory recall service.

76% → 80% correctness.

"RAG is linear. Agents are branched retrieval."

Context layer:

* semantic
* keyword
* structured filter
* raw artifacts
* provenance
* write path

"Diffuse landscape and plumbing as core driver."

Single table.

Huge moment:
Agents require MASSIVE scale.

1. 10s of billions of rows
2. 10k/s–100k/s queries
3. p99 latency
4. metadata scaling problem

"Whoa."

One customer has 1B tables.

Index build time.
Sharding.

HNSW.
Versioned context.

Reaction:
"Bitemporal data may come into play!"

Key realization:

* agents create pathological DB workloads
* context becoming infra-scale serving problem
* versioned context deeply important

---

## [Agent OS Stack / AWS / Bedrock]

Agent core.
Bedrock.

Reaction:
"This is Crimson SDK."

Three agents in prod in November.

Kiro.
Spec as collaboration surface.
Governance.

Not using Claude/Codex.

"Many agents."

Vibe coding overrated.

Knowledge graph mention.

Reaction:
"A funded startup does not mean you cannot catch them."

---

## [Bottlenecks]

"Agent iceberg."

Building is easy.
Production is HARD.

"How do we test?"

Simulation.

Workflow only small piece.

Deterministic vs non-deterministic.
Plan.
Execution.
Static testing.
Governance.

Reaction:
"This is BIG — this is my lane."

Inherited user permissions.

"How do you get data good enough for production?"

Vanguard:

* not a model-selection problem
* surrounding territory matters
* infra
* evals
* data
* observability
* feedback

Coverage.
Unknowns.

"What are you trying to solve?"

Implementation:

* data integration

"Increase context length by 1% and accuracy drops" (Stanford reference)

Quality > volume.

ServiceNow:

* retrofitting governance is hard
* rules upfront
* human-in-loop checkpoints
* hours-long tasks

"Observe WHY"

Agent evaluation dimensions:

* cost
* latency
* efficiency
* accuracy
* reliability
* path quality
* cohesiveness
* error handling

Reaction:
"Agent iceberg."

SFT / LoRA section:

* SLMs
* fine tune for extraction/classification
* data residency

Reaction:

* boring enterprise wins are classification/extraction

---

## [Below the Waterline]

"Easy demos. Hard prod. Super hard."

Core stack:

* model
* framework
* prompt
* DevEx
* identity/auth
* token factory economics
* CI/CD
* observability
* connectors
* standardized infra

"Gotta run this shit all the time."

Agent lifecycle.
Observability/debugging.

"API key is NOT enough."

HOOKS everywhere.

Centralization.
Consistency and management at runtime.

Reaction:
"I like this guy."

Identity:

* no GOD mode API keys
* Entra agent identity
* on behalf of

"Anything you do with a human employee..."

Capability discovery layer.

OSS models REQUIRED.

"We need a router."

Scheduling:

* contention
* stagger work
* multi-tenancy

"An enterprise asset: TOKEN POOLS"

Reaction:

* decouple compute from GPU

Key realization:
"The hard stuff is all below the waterline."

---

## [Coding Agents Infrastructure]

Linear.
Graphite.
OpenAI/Codex.

"Death of issue tracking."

Code review.

Graphite operators seem strong.

PR/review becoming bottleneck.

AGENTS.md overlooked.

Goal:
"Become a staff engineer."

Collecting context.

"Code review is where the shit gets generated."

More code than ever being reviewed.

Codex:
"Improve the codebase, do a commit, do a PR."

Metaview/Trends:

* signal extraction
* summarization

Reaction:

* humans stop reading diffs
* consume signals instead

Harnesses.
Token efficiency.

Linear:

* good human DX
* good agent DX

Preview environments.

"You cannot outsource the care."

---

## [AI Search Infra / You.com]

Pivot from search to agent infrastructure.

SERP scraping legality.

Open APIs for direct consumption.

Content.
Search.
Research.

Configurable APIs.
Agents manage budgets.

Reaction:
"Make the agent aware of the budget."

YOU.com defaulted in GPT OSS.

Critique of benchmarks.
Variance.
Task difficulty.
Agent inconsistency.

Reaction:

* distributions matter more than point estimates

---

## [Rogue Identity Crisis]

RPA vs agents.

Scale and speed.

OAuth.
On behalf of.

Most software not designed for this.

Agent SDKs.

Reaction:
"Do not roll your own shit."

OpenTelemetry.
Standard SDKs.

Security teams should stay out of the way.

MCP dumpster fire.

Schemas.
Resources.

Gateways.
Detection and response.

Reaction:
"WE GOTTA HAVE A GATEWAY."

Bad agent = rogue behavior.

Monitoring okay.

Trend AI:

* attackers accelerating
* agents accelerating
* security cannot keep up

Prompt injection:
"YOU WILL NOT MITIGATE PROMPT INJECTION. IT WILL HAPPEN."

Bumbling employee analogy.

EDR/XDR for agents.

Observability.
Automated response.
Identity critical.

"Defense in depth at every level."

---

## [Evals]

"The agent measurement gap."

Not enough observability discussion.
Deployment/org challenges.

Galileo:

* eval engineering is workflow
* not point-in-time
* starts before design
* LLM judges fail initially

Long winding traces.
Expensive.

"Judges do not scale."

Need cheaper methods.

"Infrastructure problem."

Observability tied to use case.

Cost per successful outcome.

Offline vs runtime topology.

Continuous feedback.

"Today's evals are tomorrow's guardrails."

Concrete number:
100–200 traces → double-digit millions.

Judge store.

Convert expensive evals into cheap guardrails.

SLM single-token outputs.
Low-latency judges.

Governance toolkit.

"WE MUST RETAIN OPTIONALITY."

Human evaluation.
KPI alignment.

"Start labeling/tagging when humans interfere."

Single biggest metric:
COST.

Biggest mistake:
not aligned to business outcome.

---

## [High-Value Raw Takes Preservation]

These takes are intentionally preserved in raw/fragmented form because they represent instinctive synthesis, skepticism, and emotional signal during the conference.

"How is it handled. There are a lot of naysayers -- if we're not showing up on reddit we're not taking enough risks."

"The hard stuff is all below the waterline."

"WE GOTTA HAVE A GATEWAY."

"YOU WILL NOT MITIGATE PROMPT INJECTION. IT WILL HAPPEN."

"The shape is slowly starting to form."

"A funded startup does not mean you cannot catch them."

"This is BIG -- this is my lane."

"Code review is where the shit gets generated."

"Agents create pathological DB workloads."

"Make the agent aware of the budget."

"The scarce resource isn't tokens -- it's domain rules."

"Humans stop reading diffs and start consuming distilled signals."

"Agent systems are distributed systems with identity, budgets, traces, and failure modes."

## [Missing Raw Takes / Recovery Buffer]

The following raw fragments were explicitly called out as missing and should be preserved verbatim or near-verbatim. These are not polished synthesis; they are source material.

"How is it handled. There are a lot of naysayers -- if we're not showing up on reddit we're not taking enough risks. The"

Raw take / likely thread:

* risk tolerance
* public visibility as signal
* if nobody is reacting negatively, the work may be too safe
* Reddit as cultural/error-signal surface
* willingness to absorb noise as evidence of pushing into real territory

Preserve as unresolved fragment. Do not over-clean.

---

## [Late-Day / Wrap]

"The hard part is not the agent."

Minimize context window.

Legacy code will remain.
Need wrappers/integrations.

"Wrappers encapsulate knowledge."

Companies ignoring token cost now.
They won't later.

POC → ROI → CFO.

Agent doing model development.

Internal vs external metrics.

"TOKEN BUDGET"

SMEs defining rules are the scarce resource.

"The shape is slowly starting to form."

Final synthesis emerging:

* agents are distributed systems
* governed runtime matters more than model
* eval/control/security/identity are the hard parts
* budget/cost/control loops everywhere

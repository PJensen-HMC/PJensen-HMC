# Day 1 Claims

Extracted from `NOTES-DAY1`, `NOTES-SCHEDULE`, Day 1 audio fragments, and Day 1 image timestamp anchors. These are source-level claims and field observations, not final analysis.

## Claims

### D1-C001 - Capture Method

- Source IDs: NOTES-DAY1; NOTES-SCHEDULE; IMG-260504-074509; IMG-260504-082510-CHATGPT
- Status: field-observation
- Claim: The Day 1 raw notes frame the capture strategy as skeptical, selective, and depth-oriented, with the recorder used as a post-talk compression layer and phone notes treated as anchors.

### D1-C002 - Datadog / Observability

- Source IDs: NOTES-DAY1; NOTES-SCHEDULE; IMG-260504-091927
- Status: captured
- Claim: The Datadog session positioned observability data, traces, logs, metrics, topology, and time-series data as the substrate for predictive world models and what-if questions.
- Claim: The same notes emphasize internal evals, recorded workflows, diverse sources, latency, and frontier-model cost as important constraints.

### D1-C003 - Glean / Sapphire Ventures

- Source IDs: NOTES-DAY1; NOTES-SCHEDULE
- Status: captured
- Claim: The notes distinguish assistants from agents by whether the system does real work for the user.
- Claim: The session notes say enterprises need governance, observability, determinism, harnesses, and learning time before jumping into agents.
- Claim: The notes record "go for toil" as the practical enterprise starting point.

### D1-C004 - CrewAI

- Source IDs: NOTES-DAY1; NOTES-SCHEDULE
- Status: captured
- Claim: The CrewAI notes say deployment and scaling are the hard parts, not the idea of agents itself.
- Claim: The notes distinguish ad hoc workflows from embedded workflows and preserve the idea that agents may need their own repositories, skills repositories, and encoded decision procedures.

### D1-C005 - UiPath / Trust Paradox

- Source IDs: NOTES-DAY1; NOTES-SCHEDULE; AUDIO-260504-1020
- Status: captured; weak audio
- Claim: The notes state that agents need more oversight as autonomy increases.
- Claim: The notes favor process orchestration over vague swarm language or a pile of MCP tools.
- Claim: The audio timestamp falls inside the session block but is too thin to carry independent claims without review.

### D1-C006 - Fetch.ai

- Source IDs: NOTES-DAY1; NOTES-SCHEDULE
- Status: captured low-signal
- Claim: The notes describe the Fetch.ai example as a consumer trip-booking agent and mark it as low-signal.

### D1-C007 - LanceDB / Retrieval

- Source IDs: NOTES-DAY1; NOTES-SCHEDULE; IMG-260504-110303; IMG-260504-110958
- Status: captured
- Claim: The LanceDB notes say agent retrieval is branched rather than linear RAG.
- Claim: The notes define the context layer as combining semantic, keyword, structured filter, raw artifact, provenance, and write-path concerns.
- Claim: The notes record agent context as an infrastructure-scale serving problem involving very large row counts, high query rates, p99 latency, metadata scaling, sharding, and versioned context.

### D1-C008 - Agent OS Stack

- Source IDs: NOTES-DAY1; NOTES-SCHEDULE
- Status: captured
- Claim: The Agent OS Stack notes discuss agent core, Bedrock, Kiro, specifications as collaboration surfaces, governance, and many-agent production use.
- Claim: The field note maps the session to internal Crimson SDK instincts.

### D1-C009 - Bottlenecks Of AI Agent Engineering

- Source IDs: NOTES-DAY1; NOTES-SCHEDULE; IMG-260504-114258
- Status: captured
- Claim: The notes frame production agent systems as hard because testing, simulation, governance, inherited permissions, data quality, observability, feedback, and eval dimensions all matter.
- Claim: The notes list evaluation dimensions including cost, latency, efficiency, accuracy, reliability, path quality, cohesiveness, and error handling.
- Claim: The notes mark extraction and classification as boring but plausible enterprise wins for smaller models.

### D1-C010 - Below The Waterline

- Source IDs: NOTES-DAY1; NOTES-SCHEDULE; IMG-260504-141312; IMG-260504-141511; IMG-260504-141645; IMG-260504-141650; IMG-260504-141800; IMG-260504-142042; IMG-260504-142129; IMG-260504-142252
- Status: captured
- Claim: The notes define the below-waterline stack as model, framework, prompt, DevEx, identity/auth, token economics, CI/CD, observability, connectors, and standardized infrastructure.
- Claim: The notes reject god-mode API keys and record Entra agent identity and on-behalf-of access as important identity patterns.
- Claim: The notes identify capability discovery, routing, scheduling, multi-tenancy, and token pools as enterprise agent runtime concerns.

### D1-C011 - Coding Agents Infrastructure

- Source IDs: NOTES-DAY1; NOTES-SCHEDULE; IMG-260504-142606; IMG-260504-142716; IMG-260504-142805
- Status: captured
- Claim: The notes say code review becomes a bottleneck as AI generates more code.
- Claim: The notes preserve AGENTS.md, harnesses, token efficiency, preview environments, and staff-engineer-level context gathering as important coding-agent infrastructure.
- Claim: The notes state that humans may stop reading raw diffs and start consuming distilled signals, but cannot outsource care.

### D1-C012 - You.com / Search Infra

- Source IDs: NOTES-DAY1; NOTES-SCHEDULE; IMG-260504-145824; IMG-260504-145830; IMG-260504-150032; IMG-260504-150420
- Status: captured
- Claim: The notes describe You.com as moving from search toward agent infrastructure, configurable APIs, and agents managing budgets.
- Claim: The notes criticize point-estimate benchmarks and record variance, task difficulty, and distributions as more important than single benchmark scores.

### D1-C013 - Rogue Agent Identity

- Source IDs: NOTES-DAY1; NOTES-SCHEDULE
- Status: captured
- Claim: The notes emphasize OAuth, on-behalf-of access, agent SDKs, OpenTelemetry, gateways, schemas/resources, and detection/response as core agent identity concerns.
- Claim: The notes state that prompt injection will happen and must be handled with defense in depth rather than assumed away.

### D1-C014 - Evals

- Source IDs: NOTES-DAY1; NOTES-SCHEDULE; IMG-260504-162127
- Status: captured
- Claim: The notes define eval engineering as an ongoing workflow, not a point-in-time check.
- Claim: The notes connect long traces, judge cost, cost per successful outcome, offline/runtime topology, human labeling, KPI alignment, and conversion of expensive evals into cheaper guardrails.

### D1-C015 - Late-Day Synthesis Residue

- Source IDs: NOTES-DAY1; NOTES-SCHEDULE
- Status: field-synthesis
- Claim: The Day 1 wrap notes preserve wrappers, legacy integration, token budgets, POC-to-ROI pressure, SMEs as scarce rule sources, and the emerging statement that agent systems are distributed systems with identity, budgets, traces, and failure modes.

## Deferred

- Image-derived slide/content claims are deferred to `slide-claims.md`.
- `AUDIO-260504-1020` and `AUDIO-260504-1044` are too weak/noisy for independent claims in this pass.

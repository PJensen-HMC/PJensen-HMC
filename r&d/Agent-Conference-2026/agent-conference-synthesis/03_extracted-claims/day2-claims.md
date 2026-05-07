# Day 2 Claims

Extracted from `NOTES-DAY2`, `NOTES-DAY2-EXTENDED`, `NOTES-SCHEDULE`, Day 2 audio transcripts, booth captures, and image timestamp anchors. These are source-level claims and field observations, not final analysis.

## Normalization Cautions

- The 09:30-10:10 morning window has conflicting scheduled-session and booth evidence streams.
- Afternoon audio filenames are earlier than the schedule slots their transcript content maps to; claims below use the session mapping from `../02_normalized/day2-timeline.md`.
- Cross-day patterns in `NOTES-DAY2-EXTENDED` are treated as field synthesis claims, not independent session events.

## Claims

### D2-C001 - Day 2 Capture Strategy

- Source IDs: AUDIO-260505-0807
- Status: captured
- Claim: The opening audio states the Day 2 plan: attend sessions, then switch to booths, spend short intervals with vendors, and report whether each product has legs.

### D2-C002 - Distyl / T-Mobile

- Source IDs: NOTES-DAY2-EXTENDED; NOTES-SCHEDULE; IMG-260505-093015
- Status: captured; time discrepancy
- Claim: The extended notes say T-Mobile partnered with OpenAI and was introduced to Distyl.
- Claim: The notes describe a CX / customer-service bot direction, high-NPS orientation, Intent-CX, text/chat channels, and a desire for customers not to need to call T-Mobile.
- Claim: The notes say traditional consulting firms did not work for this effort and that forward-deployed embedded engineers mattered.
- Claim: The field reactions preserve skepticism about customer-centric language becoming bot-mediated containment.

### D2-C003 - Upwork / Kustomer / Cresta / Discord

- Source IDs: NOTES-DAY2; NOTES-DAY2-EXTENDED; NOTES-SCHEDULE; IMG-260505-094923
- Status: captured
- Claim: The notes describe Upwork as moving from freelance marketplace toward outcome delivery through an assistant named Uma.
- Claim: The notes describe Kustomer and Cresta as customer-journey/customer-service platforms using AI for agent assistance, ambient agents, post-hoc analysis, feedback loops, and expansion beyond customer-facing work.
- Claim: The notes decompose intelligence into deciding what to do, doing the work, and evaluating the work.
- Claim: The notes preserve the claim that humans move toward advisers and verifiers when machines perform more of the execution.

### D2-C004 - Axos / OutSystems

- Source IDs: NOTES-DAY2; NOTES-DAY2-EXTENDED; NOTES-SCHEDULE; IMG-260505-101406
- Status: captured
- Claim: The notes describe wrapping the banking core to get agility without risking stability.
- Claim: The notes describe an agent workbench, context graph, log-analysis first agent, SDLC personas, pull-request agents, quality agents, and scrum-master agents.
- Claim: The notes record a claimed 50% reduction in pull-request cycle time from code-review / coaching automation.
- Claim: The field reaction flags management/timecard monitoring as surveillance drift.

### D2-C005 - Apollo / API Layer

- Source IDs: NOTES-DAY2-EXTENDED; NOTES-SCHEDULE; BOOTH-APOLLO
- Status: captured as hallway / field interview
- Claim: The Apollo capture says Apollo uses GraphQL to unify APIs and has a control layer.
- Claim: The notes say the relevant agent-readiness primitives are schema, identity, Docker packaging, Swagger/OpenAPI ingestion, and wrapping APIs rather than exposing piles of tools and endpoints.
- Claim: The field note maps this to `env.API` as a mediated capability layer.

### D2-C006 - Mistral

- Source IDs: NOTES-DAY2-EXTENDED; NOTES-SCHEDULE; IMG-260505-112339
- Status: captured
- Claim: The Mistral notes emphasize inference efficiency, model size, cost, latency, open weights, fine-tuning, and smaller models for narrower use cases.
- Claim: The notes state that context engineering is replacing naive RAG as the relevant production discipline.
- Claim: The notes identify production primitives: evals, observation, calls, harnesses, long traces, ground truth, connectors, and environment recreation.
- Claim: The field reaction flags multilingual benchmark coverage as a cultural and language-compression concern.

### D2-C007 - Bauplan / Data Agents

- Source IDs: NOTES-DAY2; NOTES-DAY2-EXTENDED; NOTES-SCHEDULE; IMG-260505-114307; IMG-260505-115251; IMG-260505-115605
- Status: captured
- Claim: The Bauplan notes say agents can fail safely in code because Git and local harnesses make failure cheap.
- Claim: The notes contrast data work as shared, slow, and potentially catastrophic when agents write tables, files, or pipelines.
- Claim: The notes describe Git-like branching for data and code as a way to let agents try, fail, and be reviewed without breaking shared state.
- Claim: The notes preserve the rule: do not assume the agent is trustworthy; dial in the blast radius.

### D2-C008 - Rasa

- Source IDs: NOTES-DAY2; NOTES-DAY2-EXTENDED; NOTES-SCHEDULE
- Status: captured
- Claim: The Rasa notes describe enterprise agents as developer-first, multimodal/voice-oriented, and scattered across multiple enterprise teams.
- Claim: The notes say hosting in the customer's environment becomes important and that model/LLM market change is rapid.

### D2-C009 - Google / Agentic Customer

- Source IDs: NOTES-DAY2; NOTES-DAY2-EXTENDED; NOTES-SCHEDULE
- Status: captured
- Claim: The Google notes say smart speakers did not become fully capable transactional agents because systems were not built for conversation.
- Claim: The notes describe agentic commerce protocols including UCP and AP2 and distinguish conversational commerce from autonomous commerce.
- Claim: The notes state that the proposed architecture is not one LLM with tools, but a translator, deterministic executor, and judge.
- Claim: The notes identify manipulation, overspend, misunderstanding, structured data, audit, and agent-optimized storefronts as merchant-side concerns.

### D2-C010 - NVIDIA

- Source IDs: NOTES-DAY2; NOTES-DAY2-EXTENDED; NOTES-SCHEDULE
- Status: captured
- Claim: The NVIDIA notes describe an internal CLI explosion, with 25 CLIs built in 10 weeks and broad adoption after Claude Code became available internally.
- Claim: The notes preserve email / Outlook / DL CLI examples, "automate everything" Slack-channel adoption, executive usage, a four-engineer CLI team, and a 30-40 PR/day operating load.
- Claim: The notes identify the velocity gap between code generation and validation/verification.
- Claim: The notes define research, gates, and sweeps as the operating model for accelerated development.
- Claim: The notes list gates/sweeps such as E2E verification, security review, architecture alignment, coverage ratchets, PR limits, dependency pinning, migration guards, CODEOWNERS, and commit linting.

### D2-C011 - Cockroach Labs / Infra Scale

- Source IDs: NOTES-DAY2-EXTENDED; NOTES-SCHEDULE; AUDIO-260505-1351; BOOTH-COCKROACHDB; IMG-260505-144848; IMG-260505-145000
- Status: captured; audio time mismatch
- Claim: The Cockroach-mapped audio and notes say agent traffic can create orders-of-magnitude load increases in calls, transactions, and system exhaust.
- Claim: The notes identify systems of record, connected tissue, consistency, durability, resilience, and elastic scale as infrastructure bottlenecks.
- Claim: The booth note describes CockroachDB as Postgres-like, deployable to Azure, and positioned around agent/database infrastructure, while the field note says fit is unclear.

### D2-C012 - CircleCI / OpenAI / Databricks

- Source IDs: NOTES-DAY2; NOTES-DAY2-EXTENDED; NOTES-SCHEDULE; AUDIO-260505-1407; IMG-260505-151015; IMG-260505-151956
- Status: captured; audio time mismatch
- Claim: The CircleCI-mapped audio cites a longitudinal study with a modest 10% productivity gain rather than huge productivity multiples.
- Claim: The notes and audio describe a perception gap between how productive developers feel with AI and measured productivity.
- Claim: The notes say CI/pipelines are failing at higher rates, recovery takes longer, and generated code does not automatically become production code.
- Claim: The notes preserve validation, taste, CI, review loops, and top-performer concentration as bottlenecks.

### D2-C013 - Monte Carlo / Data Trust

- Source IDs: NOTES-DAY2-EXTENDED; NOTES-SCHEDULE; AUDIO-260505-1503; IMG-260505-161706; IMG-260505-161718
- Status: captured; audio time mismatch
- Claim: The Monte Carlo-mapped audio says hallucinated or incorrect responses, lack of visibility, latency, and unexpected data/system access limit trust in AI agents.
- Claim: The notes say agent failures can be data failures in disguise and that source data, chunking, embeddings, vector stores, and retrieval can each introduce failure.
- Claim: The notes describe agent/data observability, circuit breakers, trace-to-upstream-DAG debugging, and an agent readiness scorecard.

### D2-C014 - MCP / Auth Panel

- Source IDs: NOTES-DAY2-EXTENDED; NOTES-SCHEDULE; AUDIO-260505-1520; IMG-260505-162032
- Status: captured; audio time mismatch
- Claim: The MCP/auth notes say MCP makes connection easier but does not solve security or authorization.
- Claim: The notes describe tool sprawl, user-vs-agent permissions, service-account limits, internal vs customer-facing differences, data leakage, and traces as sensitive data surfaces.
- Claim: The notes preserve "do not hard delete" and criticality-based action control as practical safety rules.

### D2-C015 - RingCentral / Multi-Agent Orchestration

- Source IDs: NOTES-DAY2-EXTENDED; NOTES-SCHEDULE; AUDIO-260505-1542; IMG-260505-164221; IMG-260505-164539; IMG-260505-164557; IMG-260505-164810; IMG-260505-165026; IMG-260505-165239; IMG-260505-165626; IMG-260505-165929
- Status: captured; audio time mismatch
- Claim: The RingCentral notes state that not everything needs to be an agent and that deterministic workflows should remain deterministic.
- Claim: The notes draw a boundary between agentic reasoning/research/judgment and deterministic execution.
- Claim: The notes say specialized agents beat broad generalist agents for deep domain work.
- Claim: The notes identify quality gates, overfitting detection, correlation monitoring, interpretability, exploration budgets, swarm-level reflection, and governance boundaries as necessary for multi-agent systems.

### D2-C016 - Cross-Day Pattern Claims

- Source IDs: NOTES-DAY2-EXTENDED
- Status: field-synthesis
- Claim: The source synthesizes that agents need cockpits, not keys to the building.
- Claim: The source synthesizes validation as the new bottleneck.
- Claim: The source synthesizes context engineering as the discipline replacing naive RAG.
- Claim: The source synthesizes infrastructure as underpriced in the AI narrative.
- Claim: The source synthesizes determinism as returning as a design constraint.
- Claim: The source characterizes the conference capture method as distributed cognition across human sensing and agent compression.

## Deferred

- The 09:30-10:10 conflict between booth and scheduled-session streams remains unresolved.
- Image-derived claims are deferred to `slide-claims.md`.

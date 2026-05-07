# Slide And Image Claims

Extracted from `OCR-IMAGES` and the referenced `IMG-*` sources. These are image/OCR-level claims, not final analysis. When OCR notes uncertainty or marketing heaviness, that caveat is preserved.

## Claims

### SL-C001 - Image OCR Ledger Scope

- Source IDs: OCR-IMAGES
- Status: raw-ocr
- Claim: `images-ocr.md` preserves visible slide text, uncertainty, and immediate signal notes keyed by image filename.
- Claim: The OCR ledger promotes some images beyond timestamp anchors, while leaving unreviewed images unclaimed.

### SL-C002 - Banking Systems Need Wrapped Core Integration

- Source IDs: OCR-IMAGES; IMG-260505-101406
- Status: ocr-reviewed
- Claim: The banking slide says fragmented agentic stacks hinder delivery, regulated environments require security/auditability/compliance, and core banking systems need wrapping for agility without risking stability.
- Claim: The OCR signal frames this as regulated-industry evidence for bounded agent capability around legacy cores, not replacement of core systems.

### SL-C003 - LanceDB Title / Retrieval Topic

- Source IDs: OCR-IMAGES; IMG-260504-105627
- Status: ocr-reviewed
- Claim: The LanceDB title slide identifies the session as "What Agents Want: Beyond One-Size-Fits-All Retrieval Systems" by Chang She / LanceDB.
- Claim: The OCR signal treats the session as retrieval architecture for agents, not generic vector retrieval.

### SL-C004 - Production Agents Need Non-Magical Retrieval Infrastructure

- Source IDs: OCR-IMAGES; IMG-260504-110303
- Status: ocr-reviewed
- Claim: The LanceDB slide states that production agents still need context, memory, retrieval, provenance, and latency budgets.
- Claim: The OCR signal treats retrieval as part of the production control plane rather than decorative model support.

### SL-C005 - Vector Databases Alone Are Insufficient

- Source IDs: OCR-IMAGES; IMG-260504-110958
- Status: ocr-reviewed
- Claim: The LanceDB slide says a vector database is not enough for agents.
- Claim: The slide asks operational retrieval questions about source version, index version, eval runs, and when derived context became visible.
- Claim: The OCR signal extracts the stronger claim that production retrieval is a provenance and lifecycle problem.

### SL-C006 - DataRobot Three Foundations

- Source IDs: OCR-IMAGES; IMG-260504-141312
- Status: ocr-reviewed
- Claim: The DataRobot slide presents developer experience, agent identity, and token factory economics as three foundations for production ROI.
- Claim: The slide frames each foundation as a gating condition for production ROI.

### SL-C007 - Below-Waterline Platform

- Source IDs: OCR-IMAGES; IMG-260504-141511; IMG-260504-142042
- Status: ocr-reviewed
- Claim: The DataRobot slides say agent demos are common but production ROI depends on infrastructure below the waterline.
- Claim: The slides identify auth, audit, eval, governance, first-class agent identity, and token economics as platform responsibilities.

### SL-C008 - You.com Research API And Budget-Aware Search

- Source IDs: OCR-IMAGES; IMG-260504-141645; IMG-260504-141650
- Status: ocr-reviewed
- Claim: The You.com slide positions Search API and Contents API as primitives for a harness optimized for agentic search.
- Claim: The slide says budget awareness is an optimization strategy for scalable search compute.
- Claim: The OCR signal treats search as compute infrastructure for long-horizon agents.

### SL-C009 - Agentic Evaluations Are Stochastic

- Source IDs: OCR-IMAGES; IMG-260504-141800
- Status: ocr-reviewed
- Claim: The You.com eval slide says agentic evaluation is stochastic and single-run reporting can obscure variance.
- Claim: The slide proposes Intraclass Correlation Coefficient and within-query variance as ways to distinguish real capability improvements from measurement noise.

### SL-C010 - Production Reality Is The Invisible Engineering Work

- Source IDs: OCR-IMAGES; IMG-260504-142129
- Status: ocr-reviewed; partial uncertainty
- Claim: The DataRobot slide says most engineering effort from prototype to production goes to work not shown in demos.
- Claim: The slide lists production data, reliability under scale/failure, unit economics, audit, observability, and governance as production reality.
- Caveat: The OCR ledger flags the visible `*95%` marker as uncertain.

### SL-C011 - Enterprise Readiness Is A Stack

- Source IDs: OCR-IMAGES; IMG-260504-142252; IMG-260504-142606; IMG-260504-142716
- Status: ocr-reviewed
- Claim: The DataRobot slides say enterprise readiness is a stack, not one feature.
- Claim: The slides list trace analysis, A/B testing, regression detection, cost management, CI/CD, observability/debugging, OAuth connectors, standardized auth, logging, and error patterns.
- Claim: The OCR signal says common platform substrate beats each team inventing its own production harness.

### SL-C012 - Static API Keys Are Not Agent Identity

- Source IDs: OCR-IMAGES; IMG-260504-142805
- Status: ocr-reviewed; partial cut-off text
- Claim: The DataRobot slide says static API keys are not an identity model.
- Claim: The slide identifies god-mode API keys, missing subject-vs-actor distinction, and binary/non-contextual authorization as agent identity problems.

### SL-C013 - First-Class Agent Identity

- Source IDs: OCR-IMAGES; IMG-260504-145824
- Status: ocr-reviewed
- Claim: The DataRobot identity solution slide calls for first-class agent identity, zero-trust token chaining, intersection authorization, dual IDP integration, and immutable audit lineage.
- Claim: The slide distinguishes subject authority from actor authority and computes effective permissions as their strict intersection.

### SL-C014 - Token Factory Economics

- Source IDs: OCR-IMAGES; IMG-260504-145830; IMG-260504-150032
- Status: ocr-reviewed
- Claim: The DataRobot economics slides say GPU-coupled inference creates unpredictable unit economics and fragile product contracts.
- Claim: The proposed answer is token pools, deterministic admission control, premium/spot tiers, stable SLAs, and treating inference capacity as the allocated resource.

### SL-C015 - Autonomous Agents Roadmap

- Source IDs: OCR-IMAGES; IMG-260505-114307
- Status: ocr-reviewed; forecast
- Claim: The Bauplan slide presents a roadmap from code completion, to vibe coding, to coding agents in production, to autonomous background agents in 2026-2027.
- Caveat: The OCR signal labels this as a vendor forecast, not fact.

### SL-C016 - Git For Data

- Source IDs: OCR-IMAGES; IMG-260505-115251
- Status: ocr-reviewed
- Claim: The Bauplan slide presents "Git for data" as treating data like code.
- Claim: The slide describes an agent working on a feature branch, with human review and merge before data/pipeline changes reach main.
- Claim: The OCR signal frames this as making data mutations auditable instead of ad hoc warehouse surgery.

### SL-C017 - Agent-Driven Data Pipeline Use Case

- Source IDs: OCR-IMAGES; IMG-260505-115605
- Status: ocr-reviewed; marketing-heavy
- Claim: The Bauplan use-case slide describes a property-management software customer with BigQuery, Alteryx, Databricks, and Tableau in the stack.
- Claim: The slide states a target of 90% agent-driven development with humans validating through Claude Code.
- Caveat: The OCR signal flags the claim as likely marketing-heavy.

### SL-C018 - Agent Traffic Changes Backend Load

- Source IDs: OCR-IMAGES; IMG-260505-144848; IMG-260505-145000
- Status: ocr-reviewed
- Claim: The CockroachDB slides say every agent action becomes API calls plus database transactions.
- Claim: The slides contrast human traffic as intermittent with agent traffic as continuous, exhaustive, 24/7, and compounding as agent populations grow.
- Claim: The OCR signal summarizes this as "humans breathe; agents don't."

### SL-C019 - Speed Perception Gap

- Source IDs: OCR-IMAGES; IMG-260505-151015
- Status: ocr-reviewed
- Claim: The CircleCI/METR slide states a 39-point gap between felt speed and measured speed.
- Claim: The OCR signal says subjective AI acceleration can diverge sharply from actual throughput.

### SL-C020 - Bottleneck Migrated To Validation

- Source IDs: OCR-IMAGES; IMG-260505-151956
- Status: ocr-reviewed
- Claim: The CircleCI slide says the bottleneck migrated from code generation to code validation.
- Claim: The diagram contrasts a fast AI-assisted inner loop with a slower outer loop containing tests, deploy, queue, manual review, compliance, security, slow feedback, and noisy signal.

### SL-C021 - Agent Readiness Scorecard

- Source IDs: OCR-IMAGES; IMG-260505-161706; IMG-260505-161718
- Status: ocr-reviewed
- Claim: The Monte Carlo slides divide agent readiness into data layer, semantic layer, agent-build layer, and trust layer.
- Claim: Production-grade readiness includes lineage from agent output to source, embedding drift monitors, retrieval quality alerts, tool-call traces, behavior anomaly alerts, cross-layer observability, and input-to-output lineage.

### SL-C022 - MCP Panel Attribution

- Source IDs: OCR-IMAGES; IMG-260505-162032
- Status: ocr-reviewed
- Claim: The panel title slide identifies "The Thin Line Between Magic and Tragic: Getting MCP's Right" and names panelists from Arcade, Groupon, PagerDuty, and HubSpot.
- Claim: The OCR signal treats "magic vs tragic" as shorthand for MCP's ability to unlock agents or expose unsafe tool surfaces.

### SL-C023 - Bright Line For Agent Complexity

- Source IDs: OCR-IMAGES; IMG-260505-164221
- Status: ocr-reviewed
- Claim: The RingCentral slide says known-procedure tasks with predictable output do not need agents and should be well-engineered pipelines.
- Claim: The slide places ambiguous research, hypothesis generation, strategy design, and edge-decay evaluation on the agentic side.

### SL-C024 - Specialized Agent Mandates

- Source IDs: OCR-IMAGES; IMG-260505-164539
- Status: ocr-reviewed
- Claim: The RingCentral slide shows one agent per asset class and strategy.
- Claim: Each agent is described as a bounded quant researcher that implements, backtests, evaluates, improves, and deploys within its mandate.

### SL-C025 - Swarm Architecture Boundary

- Source IDs: OCR-IMAGES; IMG-260505-164557
- Status: ocr-reviewed
- Claim: The RingCentral swarm architecture slide separates swarm-level reflection and agent mandates above a strategy deployment boundary from deterministic data ingestion, signal computation, order management, and trade execution below it.
- Claim: The slide explicitly keeps agents out of the deterministic execution pipeline.

### SL-C026 - Cross-Image Architecture Pattern

- Source IDs: OCR-IMAGES
- Status: raw-synthesis-from-ocr
- Claim: The OCR ledger synthesizes the strongest image signal as agents where ambiguity and judgment live, deterministic systems where reliability, auditability, and repeatability matter.
- Claim: The ledger identifies identity, lineage, retrieval provenance, evaluation repeatability, CI/CD, observability, cost controls, token economics, and deterministic deployment boundaries as production-grade platform controls.

## Deferred

- Images still marked `unreviewed` in `../02_normalized/image-index.md` have no promoted image-derived claims.
- OCR text with cut-off or uncertain portions should remain caveated until manual image review confirms it.

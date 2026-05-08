# Agent Conference 2026 — Raw Takes Capture

Purpose: preserve the unfiltered reactions, personal texture, skepticism, anger, excitement, contempt, surprise, and architectural signal from the conference before it gets laundered into executive language.

This is not the polished memo.
This is not the deck.
This is not the sanitized version.

This is the pressure record.

---

## Capture Rules

Preserve:
	Profanity
	Abrupt phrasing
	Personal reactions
	Unprofessional language
	Contradictions
	Visceral skepticism
	Moments of delight
	Moments of disgust
	Sharp judgments
	Unfinished thoughts
	Social observations
	Architectural realizations hiding inside emotion

Do not over-clean.
Do not soften the take too early.
Do not convert everything into leadership language immediately.

For each take, capture three layers:

Raw take
	The exact emotional version, as spoken or written.

Signal underneath
	What the reaction is actually detecting.

Later-safe translation
	How this could eventually be expressed in internal/professional language, if needed.

---

## Raw Takes

### Take 1 — NVIDIA

Raw take
	While I was listening to the NVIDIA talk, I backgrounded a thought — unpacking it here.
	
	She stated flatly that every employee was using the CLI tools. As subtext, she stated that every employee has installed Claude Code.
	
	The implications here are profound. What it means is that if people can get comfortable inside of a terminal, then all agent products are potentially wrong or misshaped.
	
	My feeling is that since NVIDIA employees have tasted caviar, they will be reticent to use something that shows you a narrower view of the world.
	
	Sure, some people may prefer a GUI. Fine. But still — the implications feel staggering, and I may be off base. I thought it was worth a mention.
	
	This is part of the reason that my conference capture and synthesis was entirely done in CODEX.

Signal underneath
	The NVIDIA talk exposed a possible category error in the agent product market: many vendors are building constrained GUI products for users who, once exposed to agentic CLI workflows, may not want the abstraction narrowed again.
	
	The terminal is not merely an interface preference. It may be a power surface: file system, repo, shell, text, execution, search, version control, and agent orchestration all co-located in one environment.
	
	If an organization can make its employees comfortable in that surface, the product frontier shifts. The winning pattern may not be “agent inside an app.” It may be “agent inside the work substrate.”
	
	This also validates the capture method itself: the conference was not only about agents; it was processed through an agentic CLI/workbench loop. The method became evidence.

Later-safe translation
	The NVIDIA session suggested that CLI-native agent workflows may represent a materially different adoption path than GUI-first agent products.
	
	If broad employee populations can become comfortable operating through terminal-based agent tools, then many current enterprise agent products may be over-constraining the user experience. GUI surfaces may remain useful for some populations and workflows, but they may not define the ceiling of agentic productivity.
	
	For HMC, the lesson is not necessarily “everyone must use a terminal.” The lesson is that agent adoption should be evaluated at the level of the work substrate: where files, code, data, commands, approvals, and execution already live.
	
	This also reinforces the value of governed capability surfaces. A powerful CLI-agent environment becomes viable only if the underlying execution substrate is bounded, observable, and policy-aware.

---

### Take 2 — Governance Without a How

Raw take
	Three days on, I am still left in a sort of suspense.
	
	Everyone is saying governance. Everyone is saying auditability and observability. But absolutely zero people are directly saying how.
	
	It seemed like two options:
		a) home-brew implementations
		b) buy some narrowly scoped product
	
	It really struck me that this is still a very much unsolved problem.
	
	Which makes sense when you think about the software maturity cycle, the fact that it is only three years in, and the fact that many, many architectural mistakes will be made and learned from.

Signal underneath
	The conference surfaced strong consensus around the need for agent governance, but weak consensus around implementation architecture.
	
	The language is mature before the systems are mature. “Governance,” “auditability,” and “observability” have become mandatory vocabulary, but the operational substrate remains unrefined, early stage products, broad competition.
	
	The market appears split between two immature paths: organizations inventing bespoke internal control planes, or vendors selling narrow point solutions that cover only slices of the problem.
	
	This suggests the space is still pre-pattern. The durable architectures have not fully emerged. The next few years will likely include overfitted platforms, compliance theater, brittle wrappers, duplicated telemetry, and control surfaces that collapse under real agentic execution pressure.
	
	The unsolved nature of the problem is not a failure of the conference. It is the actual signal.

Later-safe translation
	A recurring theme across the conference was the importance of governance, auditability, and observability for agentic systems. However, the implementation path remains under-specified.
	
	Most discussions acknowledged the need for control and visibility, but fewer described concrete architectures for identity, delegated authority, capability boundaries, execution logging, traceability, evaluation gates, rollback, or operational review.
	
	The current market appears early. Enterprises are likely to face a choice between building internal governance mechanisms or adopting narrowly scoped vendor products that address only part of the control-plane problem.
	
	For HMC, this reinforces the need to treat agent governance as an architectural problem, not merely a procurement problem. The goal should be to define the internal control model before committing to any single vendor abstraction.

---

### Take 3 — Datadog and the Operational World Model

Raw take
	Datadog — this was interesting, and HMC is circling the problem.
	
	The idea was to surface traces, logs, metrics, topology, and time series as an underlying “world model.” Very cool.
	
	Why: because it allows agents to operate at a meta layer.
	
	One more key detail: they constructed a time-series-based model and published it on Hugging Face. We are talking hundreds of billions of datapoints.
	
	Very, very fucking cool.

Signal underneath
	Datadog was not merely presenting observability as dashboards. The deeper idea was that observability data can become machine-usable context for agents.
	
	Traces, logs, metrics, topology, and time-series data together form a representation of system reality: what exists, what changed, what is connected, what is degrading, what failed, and what patterns recur over time.
	
	That turns observability into an agentic substrate. Agents do not just inspect dashboards. They reason over operational state, detect anomalies, correlate behavior across layers, propose interventions, and potentially operate above individual systems as a meta-control layer.
	
	This matters for HMC because HMC is already circling a similar problem: how to give non-human actors enough operational context to act usefully without giving them ambient authority or forcing humans to manually assemble context from scattered tools.
	
	The time-series model detail is especially important. Training or publishing a model on hundreds of billions of operational datapoints suggests that the telemetry layer itself may become a foundation-model domain, not just a monitoring product category.

Later-safe translation
	The Datadog session suggested a broader interpretation of observability for agentic systems. Rather than treating traces, logs, metrics, topology, and time-series data as human-facing diagnostic artifacts, they can be treated as a structured operational world model.
	
	This would allow agents to reason about systems at a meta layer: correlating signals, understanding dependencies, detecting degradation, and proposing or executing bounded remediation workflows.
	
	For HMC, the relevant takeaway is that observability should not be framed only as dashboards or App Insights-style telemetry. It should be evaluated as part of the agent control plane: the contextual layer that tells agents what is happening, what changed, and what actions are safe to consider.
	
	The referenced time-series model work further suggests that operational data may become a specialized modeling domain. This reinforces the importance of retaining high-quality execution, event, and telemetry history in machine-readable form.

---

### Take 4 — Bottlenecks, Simulation, and ECS Substrate

Raw take
	One thing I really liked was around the bottlenecks talk.
	
	In my own brain, I forked heavily into thoughts about simulation and the strengths of my ECS architecture and substrate projects.
	
	This really exploded in my mind, leaving indelible paint all over the walls.

Signal underneath
	The bottlenecks talk triggered a deeper architectural association: agent systems are not only about task execution, prompts, or workflows. They are also about modeling constrained systems, running structured processes, and understanding where throughput, authority, context, state, and decision latency accumulate.
	
	That maps directly onto simulation thinking. A mature agent architecture may need something like an execution physics: entities, components, systems, constraints, events, state transitions, bottlenecks, and feedback loops.
	
	The ECS connection is not incidental. ECS architecture separates state, behavior, and system execution in a way that is unusually compatible with agentic orchestration. It gives clean boundaries, inspectable state, composable systems, deterministic loops, and explicit event flow.
	
	The emotional force of the reaction matters: the talk did not merely provide an idea; it caused a collision between conference content and existing substrate work. The result was recognition. The architecture already under development may be more relevant to enterprise agent systems than previously assumed.

Later-safe translation
	The bottlenecks session raised an important architectural question: agent systems should be evaluated not only as automation tools, but as constrained execution systems with identifiable bottlenecks across state, context, authority, throughput, and feedback.
	
	This connects to simulation-oriented architecture. Enterprise agent systems may benefit from explicit modeling of actors, capabilities, events, state transitions, and control loops rather than ad hoc workflow chains.
	
	For HMC, this suggests that some lessons from ECS-style architectures may be applicable to agent orchestration: clean separation of state and behavior, explicit system boundaries, inspectable execution, event-driven coordination, and deterministic replay where possible.
	
	The broader takeaway is that agent architecture may need to look less like a collection of chat interfaces and more like a governed simulation substrate for work.

---

### Take 5 — Forward-Deployed Engineers

Raw take
	Forward-deployed engineers was interesting.
	
	This is not the first time I had heard of that. On Instagram, I saw a guy fly to someone’s home and they built an app in real time. Of course, buddy paid through the nose for the service.
	
	But — yeah, forward deployment. It is a thing, and I think I understand why.

Signal underneath
	Forward deployment is not just a staffing model. It is a response to the gap between generic AI capability and situated organizational reality.
	
	The model exists because the hard part is not only building the app. The hard part is entering the user’s environment, understanding the local workflow, seeing the unspoken constraints, compressing ambiguity, and converting messy intent into an executable system while the context is still hot.
	
	In agentic development, proximity becomes leverage. A forward-deployed engineer can observe the real workflow, shape the problem boundary, select the right abstractions, and build against lived constraints instead of a sanitized requirements document.
	
	The Instagram anecdote matters because it shows the premium version of the same pattern: someone pays heavily not only for engineering labor, but for immediacy, translation, taste, judgment, and co-present synthesis.
	
	This also explains why enterprise agent systems cannot succeed purely as remote generic platforms. The successful implementations may require embedded translation work: people who can stand between the business process, the agent substrate, the data, the controls, and the actual users.

Later-safe translation
	The forward-deployed engineering theme suggests that agent adoption may require more than centralized platform delivery.
	
	Because many workflows are highly contextual, organizations may need embedded technical translators who can work close to business users, observe real process constraints, and rapidly convert local needs into governed agent-enabled capabilities.
	
	This does not necessarily imply a large consulting model. Internally, it may mean creating a small forward-deployed function that combines engineering, product judgment, process analysis, and governance awareness.
	
	For HMC, the relevant lesson is that agentic capability may need to be brought into the workflow, not merely exposed as a tool. The people doing that work must understand both the substrate and the business context.

---

### Take 6 — The Future Is FOSS

Raw take
	The future is FOSS.
	
	I do not think there is an easy way around this.
	
	Costs will explode. Mistral framed SLMs as particularly strong for classification, and made a great case for using them there.
	
	Personally, I desperately want this to happen.
	
	You already know why.

Signal underneath
	This take combines economics, architecture, and personal conviction.
	
	The economic signal is that agentic systems will create sustained inference demand. If every workflow, internal tool, classification pass, extraction step, review loop, evaluation sweep, and background agent action routes through expensive frontier models, cost becomes structural rather than incidental.
	
	The architectural signal is that not every cognitive task needs a frontier model. The clearest case presented was classification: bounded, repeatable, evaluable decision work where smaller models may be cheaper, faster, and more controllable.
	
	Mistral’s case for SLMs matters because it points toward model stratification, with classification as the strongest near-term fit: use smaller models where the task shape is known, bounded, and evaluable; reserve frontier models for tasks that require broader reasoning, synthesis, ambiguity handling, or high-value judgment.
	
	The FOSS point goes beyond cost. Open models create inspectability, portability, local deployment options, bargaining power, experimentation freedom, and reduced dependency on enclosed vendor platforms.
	
	The personal charge underneath this is clear: FOSS is not only a procurement preference. It is an escape vector from enclosure, artificial scarcity, vendor lock-in, and systems that make builders rent back their own leverage.

Later-safe translation
	The conference reinforced the importance of open and smaller-model strategies for enterprise agent adoption.
	
	As agentic workloads expand, inference cost is likely to become a material architectural concern. Enterprises should avoid assuming that every agentic task requires a frontier model.
	
	A more sustainable pattern is model tiering, with classification as a particularly strong fit for smaller models. Larger models should be reserved for synthesis, complex reasoning, and ambiguous workflows.
	
	Open models and FOSS-oriented tooling should be evaluated as part of the enterprise AI strategy because they can improve cost control, deployment flexibility, transparency, and negotiating leverage.
	
	For HMC, the practical takeaway is to design the agent substrate so models remain swappable. The control plane should not be overfit to one provider, one API shape, or one frontier-model pricing regime.

---

### Take 7 — CockroachDB and “Billions of Tables”

Raw take
	CockroachDB — I liked this guy.
	
	He flat out stated “billions of tables.”
	
	That sounds psychotic to me.

Signal underneath
	The reaction is partly technical disbelief and partly architectural fascination.
	
	“Billions of tables” sounds absurd because most conventional database design instincts treat tables as durable schema objects, not as something that should exist at extreme cardinality.
	
	The interesting signal is that agentic and multi-tenant systems may pressure infrastructure into shapes that feel unnatural by legacy design standards. If every customer, agent, workflow, sandbox, simulation, tenant, or generated application wants its own isolated data surface, the unit of database design may shift.
	
	What sounds psychotic may be evidence of a different operating assumption: schema objects becoming cheap, isolated, and highly numerous rather than scarce, centralized, and manually curated.
	
	The positive reaction to the speaker matters too. The take is not dismissal. It is respect mixed with alarm: the claim sounded extreme, but it also pointed toward real infrastructure pressure.

Later-safe translation
	The CockroachDB session raised an important infrastructure question around extreme scale and isolation models.
	
	The reference to “billions of tables” challenges conventional assumptions about schema design and database object cardinality. While that framing sounds extreme from a traditional enterprise architecture perspective, it may reflect emerging demands from highly multi-tenant, agentic, generated, or sandboxed application environments.
	
	For HMC, the relevant takeaway is not that we should literally pursue massive table counts. The takeaway is that agentic systems may increase pressure for cheap isolation, delegated storage surfaces, and infrastructure patterns that support many bounded execution contexts.
	
	This connects to the broader control-plane theme: if agents or generated micro-apps create state, the organization needs clear rules about where that state lives, how it is isolated, how it is audited, and when it is destroyed.

---

### Take 8 — Monte Carlo

Raw take
	Monte Carlo seemed like a cool company.
	
	This was probably my third favorite talk.

Signal underneath
	Monte Carlo registered as positive signal: a company operating near the data reliability, observability, trust, and agent-supervision layer that becomes increasingly important when agents depend on enterprise data.
	
	The relevance is not only data quality in the traditional dashboard sense. It is trust in the substrate. If agents are going to reason over enterprise data, trigger workflows, produce summaries, or support decisions, then the reliability and provenance of the underlying data becomes part of the agent control plane.
	
	The especially important point: Monte Carlo had agents monitoring agents, with circuit breakers. That matters because it moves the conversation from “agent outputs are useful” to “agent behavior itself must be observed, evaluated, interrupted, and bounded.”
	
	Monte Carlo sits close to that problem: what changed, what broke, what data can be trusted, where lineage matters, whether an agent is drifting, when execution should be halted, and how humans or agents know whether a downstream answer is built on rotten inputs.

Later-safe translation
	Monte Carlo appeared relevant as a data reliability and observability vendor, particularly in the context of agentic systems that require trustworthy data inputs, provenance, lineage, operational confidence, agent monitoring, and circuit breakers.
	
	For HMC, the broader takeaway is that data reliability and agent supervision should be treated as part of agent readiness. Agents cannot safely act on enterprise data if the organization cannot determine whether that data is fresh, valid, complete, explainable, and whether the agent behavior itself remains inside acceptable bounds.

---

### Take 9 — RingCentral and the Deterministic-Agent Boundary

Raw take
	RingCentral — this was easily my second favorite talk.
	
	This was about the deterministic versus agent boundary.
	
	Specialization over generalization.
	
	Quality gates.
	
	Agents: research, propose, reflect, swarm reflection.
	
	Deterministic systems: enforce, execute, measure.

Signal underneath
	RingCentral landed because it made the boundary crisp.
	
	The important claim is not “agents should do everything.” The important claim is the opposite: agentic systems become safer and more useful when they are surrounded by deterministic machinery.
	
	Agents are strong at ambiguity-facing work: research, synthesis, proposal generation, reflection, swarm reflection, option formation, and context assembly.
	
	Deterministic systems are where enforcement belongs: policy checks, permissions, workflow execution, measurement, audit trails, quality gates, and final state transitions.
	
	This is specialization over generalization. Do not ask agents to be the control system. Use agents to reason inside a governed execution architecture, then let deterministic systems enforce the boundary.
	
	This likely resonated because it matches the emerging HMC thesis: the agent is not the product. The control plane is the product.

Later-safe translation
	The RingCentral session provided one of the clearest architectural distinctions from the conference: separate agentic reasoning from deterministic enforcement.
	
	Agents are well-suited for research, context gathering, proposal generation, reflection, swarm reflection, and recommendation. Deterministic systems should own execution, enforcement, measurement, auditability, and quality gates.
	
	For HMC, this reinforces the need to design agent workflows around explicit handoff points. Agents may propose actions, but governed systems should validate, authorize, execute, log, and measure those actions.
	
	This pattern supports reliability, auditability, and risk control without discarding the flexibility of agentic reasoning.

---

## Emerging Pattern Bank

Use this section only after several takes accumulate.

Pattern
	CLI-native agents may be a materially different adoption surface than GUI-first agent products.

Evidence
	NVIDIA’s broad internal CLI usage; conference capture and synthesis being performed through CODEX; the “tasted caviar” reaction.

Why it matters
	The interface layer may determine the ceiling of agentic productivity. Narrow GUI tools may underfit expert workflows once users experience agents operating inside the broader work substrate.

Possible internal framing
	Evaluate agent products by whether they operate where work already lives: repos, files, commands, data, approvals, execution, and logs.

---

Pattern
	Governance vocabulary is ahead of governance architecture.

Evidence
	Repeated references to governance, auditability, and observability, but little concrete implementation detail.

Why it matters
	The problem remains pre-pattern. Organizations that define the control plane early may avoid brittle home-brew systems and narrow vendor traps.

Possible internal framing
	Agent governance should be treated as architecture, not procurement.

---

Pattern
	Observability is becoming an agentic world model.

Evidence
	Datadog framing traces, logs, metrics, topology, and time series as machine-usable operational context; time-series model work at massive scale.

Why it matters
	Agents need operational reality, not just prompts. Telemetry becomes the substrate for reasoning, diagnosis, and bounded remediation.

Possible internal framing
	Observability should feed the agent control plane, not merely dashboards.

---

Pattern
	Agent systems need deterministic boundaries.

Evidence
	RingCentral’s distinction between agentic research/proposal/reflection and deterministic enforcement/execution/measurement.

Why it matters
	This is the safety pattern. Agents can reason in ambiguity, but deterministic systems should own final authority, quality gates, and state changes.

Possible internal framing
	Agents propose; governed systems authorize, execute, log, and measure.

---

## Phrases Worth Preserving

	The language is mature before the systems are mature.
	
	Observability stops being a dashboard layer and becomes the agent’s world model.
	
	Forward deployment is a response to the gap between generic AI capability and situated organizational reality.
	
	FOSS is not only a procurement preference. It is an escape vector from enclosure.
	
	Agents research, propose, and reflect. Deterministic systems enforce, execute, and measure.
	
	Build the control plane, not the magic trick.
	
	The method became evidence.
	
	Respect mixed with alarm.
	
	Leaving indelible paint all over the walls.

---

## Things That Should Not Be Said at Work, But Should Not Be Lost

	Since NVIDIA employees have tasted caviar, they will be reticent to use something that shows you a narrower view of the world.
	
	Everyone is saying governance. Everyone is saying auditability and observability. But absolutely zero people are directly saying how.
	
	Very, very fucking cool.
	
	This really exploded in my mind, leaving indelible paint all over the walls.
	
	Of course, buddy paid through the nose for the service.
	
	The future is FOSS.
	
	That sounds psychotic to me.

# Agent Conference 2026: The Field Story

This is the actual story behind the artifact.

Not the executive memo. Not the polished argument. Not the source ledger.

This is the path through the conference: what hit live, what felt fake, what clicked, and how a two-day firehose became operational intelligence.

## Day 1: Entering In A Bad Mood

The conference starts with skepticism.

The operating frame was blunt:

> I am going in a huge skeptic.

The plan was not to attend politely. It was to sample hard, leave fast, and look for real mechanism underneath agent claims.

The Day 1 rule was basically:

- preserve attention;
- depth over breadth;
- look for structure, not networking;
- use the recorder as a compression layer;
- keep phone notes as anchors;
- leave when a talk turned into vapor.

The first useful thing was not a product. It was a posture: do not be dazzled by agents. Look for constraints, evals, failure modes, and operating surfaces.

That became the rest of the conference.

## Datadog: Observability Becomes A World Model

The first real signal came early.

Datadog framed observability as more than dashboards: traces, logs, topology, time series, alerts, events, prediction, and internal evals feeding a world model.

The live reaction was:

> I wonder if this can be used for financial modeling or higher level agents.

That matters because it was the first moment the conference stopped being about chatbots. Observability data looked like a predictive substrate. Workflows themselves were becoming training and eval assets.

The seed was planted: production agents do not just need prompts. *They need a model of the world they are acting inside.*

## Morning Day 1: The Pattern Starts To Separate From The Hype

The early talks kept sharpening the distinction.

Sapphire / Glean produced one of the most useful adoption heuristics:

> Go for toil.

Not glamour. Not broad autonomy. Toil.

CrewAI created a different kind of pull. The reaction was immediate:

> This is where I want to be.

The durable point was not the brand. It was the workflow distinction: ad hoc workflows versus embedded workflows, internal applications, skill repositories, and encoded decision procedures.

Then UiPath made the first warning explicit:

> Pile of MCP is not enough.

And the live reaction:

> I could not agree more -- its about process orchestration -- not a swarm.

By late morning, the story was already moving away from agent spectacle and toward orchestration, oversight, and reusable operating patterns.

## LanceDB: Context Stops Being Decorative

LanceDB made context feel physical.

The raw notes captured branched retrieval, semantic and keyword layers, structured filters, raw artifacts, provenance, write paths, metadata, p99 latency, sharding, and enormous scale.

The note that landed live was:

> Whoa.

This was the first time retrieval stopped feeling like a RAG checkbox. It became infrastructure. Context had load, latency, provenance, budgets, and write paths.

The raw LanceDB block also preserved the "1B tables" anecdote. Keep that caveated. The important part is not the exact number; it is that agent context work creates scale shapes normal application architectures may not be ready for.

## Afternoon Day 1: Below The Waterline

DataRobot was the cleanest Day 1 productization signal.

The memorable line in the notes was:

> Easy demos. Hard prod. Super hard.

And then:

> Gotta run this shit all the time.

That talk pulled the hidden substrate into view: model, framework, prompt, developer experience, identity, auth, token economics, CI/CD, observability, connectors, lifecycle, capability discovery, routing, scheduling, multi-tenancy, and token pools.

The reaction was simple:

> I like this guy.

Then the architecture clicked:

> The hard stuff is all below the waterline.

That became one of the load-bearing ideas of the whole artifact. The visible agent is the small part. The production system is underneath.

## Coding Agents: The Review Wall Appears

The coding-agent infrastructure material made the human bottleneck concrete.

PRs and review were becoming the constraint. AGENTS.md mattered. Harnesses mattered. Preview environments mattered. Staff-engineer-level context gathering mattered.

The raw line that survived was:

> Code review is where the shit gets generated.

Then the more durable form:

> Humans stop reading diffs and start consuming distilled signals.

That is a big deal. It says agent adoption changes the shape of attention. The human does not disappear; the human needs better review signals.

The moral line was already there:

> You cannot outsource the care.

## Day 1 Security And Evals: The Gateway Emerges

The rogue-agent identity material made the safety story explicit.

The reactions were not subtle:

> Do not roll your own shit.

> WE GOTTA HAVE A GATEWAY.

> YOU WILL NOT MITIGATE PROMPT INJECTION. IT WILL HAPPEN.

This was where the gateway stopped being a nice-to-have. Prompt injection, inherited permissions, agent identity, OpenTelemetry, schemas, resources, defense in depth, monitoring, and automated response all pointed at the same thing: agents need a controlled passage into enterprise systems.

The eval talk then added the lifecycle:

> Today's evals are tomorrow's guardrails.

Evals were not a launch checklist. They were operational material. Expensive evals had to become cheap guardrails. Human intervention had to be labeled. Cost per successful outcome mattered.

By the end of Day 1, the shape was visible:

> Agent systems are distributed systems with identity, budgets, traces, and failure modes.

## Day 1 Wrap: The First Synthesis

The day closed with the line that probably should have been on the wall:

> The scarce resource isn't tokens -- it's domain rules.

That moved the whole thing from model choice to organizational memory.

Wrappers mattered because wrappers encapsulate knowledge. Legacy systems were not going away. Token cost was being ignored but would not stay ignorable. SMEs were the scarce source of rules.

The raw note said:

> The shape is slowly starting to form.

That was the real Day 1 ending. Not certainty. Shape.

## Day 2 Morning: The Moral Edge Shows Up

Day 2 opened with customer-agent stories and a little unease.

There was useful talk about outcomes, customer support, simulations, feedback loops, humans as advisers and verifiers, and the difference between deciding, doing, and evaluating.

But there was also discomfort.

The T-Mobile / Distyl thread preserved the agency-versus-containment risk. The banking material sharpened it further when management and timecard monitoring entered the picture.

The note was plain:

> This sounds disgusting.

That reaction matters. It kept the artifact from becoming naive accelerationism. The same substrate can reduce toil or become surveillance and containment. Use-case selection is moral architecture.

## Apollo: The Cockpit Line

Apollo was not captured as the formal talk. It was captured as hallway / field intelligence.

That is part of the story.

The note says:

> Got carried away talking to Apollo.

The idea that survived was the cockpit:

> The agent should never see the whole machine. It should see a cockpit.

This became one of the strongest metaphors in the final work:

> Agents need cockpits, not keys to the building.

It connected API descriptions, schema, identity, Swagger ingestion, Docker packaging, wrappers, and runtime boundaries into one simple architectural idea: do not expose the building. Expose governed controls.

## Bauplan: Let Agents Fail Somewhere Safe

Bauplan was the data version of the same story.

The live question was uncomfortable:

> How many of you would let an agent touch production data?

The answer was basically no one.

The talk made safe failure vivid. Code agents can fail in branches, diffs, tests, and pull requests. Data agents can corrupt shared state, break pipelines, and create slow-motion damage.

The line that mattered:

> DO NOT ASSUME THAT THE AGENT IS TRUSTWORTHY.

And the deeper pattern:

> You MUST allow it to fail without the disruptive consequences.

Bauplan gave the control-plane story a data substrate. Agents need somewhere to be wrong before they are allowed to be consequential.

## Google: Do Not Send One Model Wandering Around The Market

The Google commerce talk turned customer agents into systems design.

The reaction was fascination and alarm: an agent buying a coffee machine sounds small until it misunderstands preferences, overspends, or gets manipulated.

The decisive point:

> ITS NOT ONE LLM WITH TOOLS.

Instead, the story was translator, deterministic executor, judge, structured data, protocols, trust, audit, and human-in-the-loop boundaries.

That talk strengthened the execution-boundary idea. Let models reason where they are useful. Let deterministic systems execute where the world needs stability.

## NVIDIA: The Favorite Talk

NVIDIA was the emotional high point.

The raw notes make that obvious:

> interesting -- she's building CLIs -- to plug into harnesses

> They built 25 CLIs in 10 weeks

> the adoption EXPLODED (I really like this story)

> STRAIGHT TO ENGINEERING PRACTICES (IM HERE ALREADY)

This was not just about NVIDIA. It was about a practical substrate for accelerated work.

The CLI point mattered because CLIs are boring in exactly the right way. They are callable, inspectable, composable, scriptable, and governable. They can plug into harnesses. They can become capability surfaces.

Then the talk hit the core:

> THE VELOCITY GAP

Writing accelerated first. Validation lagged behind.

The answer was not "more agents." It was:

> RESEARCH -- GATES -- SWEEPS

The live reaction:

> BINGO -- this is nailing it

And then:

> Sweeps clean what gates cannot see.

This is why the micro-site idea itself felt right. The speaker was not making a deck; the presentation was closer to a living artifact. The medium matched the thesis: show the system, let people inspect it, give them handles.

The NVIDIA talk was note-backed, not audio-backed, but it carried one of the strongest field impressions:

> Gates and sweeps are how organizations absorb AI velocity without rotting.

## CockroachDB: Humans Breathe. Agents Do Not.

CockroachDB shifted the story from software delivery to infrastructure load.

The reaction was intense because it connected to something obvious once said aloud:

> agent driven load HAS NOT FUCKINNG LANDED

The live editorial version:

> 1000 agents vs 1000 humans is RADICALLY different.

Humans pause. Agents proliferate, retry, inspect, and query continuously.

This became the cleaner line:

> Humans breathe. Agents do not.

The exact product fit stayed uncertain, but the infrastructure warning did not. Agent-shaped traffic changes database, API, queue, auth, CI, observability, and budget assumptions.

## CircleCI / METR: Speed Is Not Throughput

The CircleCI / METR material preserved the validation gap from another angle.

The live line:

> THE FASTEST IS WRONG.

That note sits next to the feeling of letting agents rip and burning tokens. The emotional truth is useful: acceleration feels empowering until validation cannot keep up.

The durable lesson was not anti-agent. It was anti-false-throughput.

If generated work exceeds review capacity, the organization has not increased delivery. It has moved the bottleneck and made quality harder to see.

## Monte Carlo: Bad Agent Answers Can Be Data Failures

Monte Carlo made the data-quality version of the same point.

Bad output may not be a model failure. It may be source, chunking, embedding, retrieval, freshness, schema, semantic drift, or trust failure.

The raw enthusiasm:

> THE AGENT READINESS SCORE CARE <-- this is awesome

The useful pattern: readiness is observable. Agent systems need data observability, semantic observability, build observability, and trust observability before bad answers can be debugged.

## MCP Panel: Connection Is Not Governance

The MCP panel was chaotic in the right way.

It showed scale, sprawl, auth confusion, traces with sensitive data, customer-facing versus internal differences, criticality, and destructive-action risks.

The raw notes preserved the practical horror:

> MCP bagloads flooding tokens.

> Grafana MCP call deleted whole policy.

And the conclusion:

> MCP is not a security model.

This reinforced the gateway. Standards make connection easier. They do not automatically make action safe.

## RingCentral: The Final Architecture Click

RingCentral was the closing architecture talk.

The live reaction was not subtle:

> NOT EVERYTHING NEEDS TO BE AN AGENT <-- yuuuup -- YUUUP

Then:

> THIS IS VERY FUCKING COOL -- I'm jazzed about what he's saying.

The talk landed because it drew the boundary cleanly:

- agents for reasoning, research, hypotheses, exploration, judgment;
- deterministic systems for known procedures and execution;
- specialization over generalist agents;
- quality gates to prevent self-delusion;
- swarm-level reflection as management, not chatter.

The phrase that survived:

> Architecture is the management structure.

That is where Day 2 ended. Not with "build a swarm," but with a governed organization of non-human work.

## After The Conference: The Pair Becomes The Product

The raw capture by itself was not the deliverable.

The deliverable came from the loop after the conference:

- raw notes stayed raw;
- schedules were reconciled;
- audio and image evidence were indexed;
- timelines were normalized;
- claims were extracted;
- caveats were preserved;
- field signals were separated from endorsements;
- the executive packet was distilled;
- the microsite became an interactive presentation layer.

This is where the human-agent pair became more than a metaphor.

The human captured taste, attention, skepticism, excitement, discomfort, and live priority. The agent carried the tedious structure: reconciliation, indexing, claim IDs, source layering, repeated passes, and compression.

The result was not "AI wrote a summary."

The result was a research method:

> Human judgment in motion, agent compression after the fact, evidence preserved throughout.

That is why the artifact feels different. It has the immediacy of field notes and the inspectability of a research pipeline.

## The Actual Story In One Line

I walked into Agent Conference 2026 skeptical, looking for mechanism beneath hype. Across two days, the signal kept converging: agents are not magic workers to be trusted; they are non-human actors that need cockpits, gates, sweeps, context provenance, deterministic boundaries, safe failure surfaces, and human judgment. The work product exists because the same pattern was used to make it: a human drank from the firehose, and an agent helped turn the firehose into something usable.

That is the story.

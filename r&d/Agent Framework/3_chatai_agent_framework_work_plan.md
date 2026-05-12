# HMC ChatAI Agent Framework Migration and Provider Strategy

Date: 2026-05-12  
Status: capture / planning  
Service: `HMC.ChatAI.Service`  
Decision shape: migrate ChatAI to Microsoft Agent Framework, make OpenAI and Anthropic first-class providers, validate Gemini as the stretch provider, no multi-agent migration by default

## Executive Summary

This work plan has two goals:

1. Migrate `HMC.ChatAI.Service` from raw OpenAI SDK orchestration and manual tool loops to a single Aivy agent built on Microsoft Agent Framework.
2. Make ChatAI provider-pluggable, with OpenAI/Azure OpenAI and Anthropic Claude as first-class runtime choices, and Google Gemini as the stretch provider after its .NET/Agent Framework integration path is proven.

The sequencing should stay blunt:

- Phase 1 proves Agent Framework parity on OpenAI/Azure OpenAI because it is closest to the current ChatAI implementation.
- Phase 2 extracts provider/model policy so provider routing is a real abstraction, not controller-level `if` blocks.
- Phase 3 makes Anthropic Claude a first-class provider for Aivy chat, tool use, structured output, streaming, and reasoning profiles.
- Phase 4 validates Gemini through `Google.GenAI`, Vertex AI, and/or a custom `IChatClient` bridge before allowing production selection.
- Avoid multi-agent orchestration unless a workflow has an explicit, durable business process. Provider routing is not multi-agent routing.

The migration should cull custom orchestration code aggressively, but only after a side-by-side agent path proves parity for streaming, SignalR status, SmartSearch2 blocks, Ask-Aivy, persistence, and cancellation.

## Strategic Plan

Strategic intent: turn ChatAI from an OpenAI-shaped custom orchestration service into an Agent Framework-based Aivy runtime with a provider policy layer. The user-visible product contract should not change while the backend gains provider choice.

| Strategic track | Outcome | Primary gate |
|---|---|---|
| Agent Framework cutover | A single Aivy agent can run the current ChatAI happy path through Agent Framework. | OpenAI/Azure OpenAI path matches current streaming, tool, persistence, cancellation, and Ask-Aivy behavior. |
| Provider policy layer | Provider selection is centralized in model profiles, not scattered through controllers or tool code. | `ModelProfile`, `ReasoningProfile`, capability flags, and compliance approval can reject incompatible requests before runtime. |
| Anthropic first-class support | Claude is a real runtime option, not an experiment hidden behind one-off code. | Claude passes text chat, streaming, tool use, structured output, SmartSearch2 synthesis, token accounting, and rollback tests. |
| Gemini stretch validation | Gemini becomes selectable only after the integration path is proven. | `Google.GenAI`, Vertex AI, and/or custom `IChatClient` bridge passes the same parity harness as OpenAI and Anthropic. |
| Legacy orchestration deletion | Manual tool loops and OpenAI-specific shims shrink or disappear. | Compatibility window is complete and rollback no longer depends on the old `ChatJob` loop. |

Execution principles:

- Treat OpenAI/Azure OpenAI as the migration wedge because it is closest to current ChatAI.
- Treat Anthropic as the second first-class provider, with its own profiles and reasoning mappings.
- Treat Gemini as a stretch provider until .NET/Agent Framework integration is proven against HMC workflows.
- Keep HMC-owned RAG, SmartSearch2, SignalR blocks, Cosmos history, and distributed cancellation authoritative.
- Keep provider routing separate from multi-agent orchestration.
- Keep hosted provider tools optional; do not let them bypass HMC permissions, citations, or retrieval policy.

Success means the same Aivy product surface can run against OpenAI/Azure OpenAI or Anthropic through Agent Framework, with Gemini on a validated path, while the custom OpenAI-only orchestration code becomes removable.

The Agent Framework provider plan needs three explicit axes:

- Model provider: who owns the model family, such as OpenAI, Anthropic, Google, or open-weight model publishers.
- Agent Framework provider: the runtime adapter HMC builds the agent with, such as Azure OpenAI, OpenAI, Microsoft Foundry, Anthropic, Ollama, GitHub Copilot, Copilot Studio, or a custom `IChatClient`.
- Inference provider: where HMC sends the request and buys the capacity, such as Azure OpenAI, OpenAI direct, Microsoft Foundry, Anthropic direct, AWS Bedrock, Google Vertex AI, Google AI, or Ollama.

Do not collapse those axes into one enum. `Claude via Agent Framework Anthropic`, `Claude via Microsoft Foundry`, and `Claude via a custom Bedrock/Vertex adapter` are different runtime profiles even when the underlying model snapshot is logically the same.

## Source Baseline

Current service shape:

- `HMC.ChatAI.Service` currently uses the raw OpenAI .NET SDK via `OpenAI.Chat.ChatClient`.
- The central orchestration point is `Domain/Services/ChatJob.cs`.
- Tools are represented by `IChatFunction`, optional streaming/status interfaces, and a manual tool dispatch loop.
- `ReflectService` contains a second manual tool loop for stateless/reflect calls.
- `ChatContext` and `ChatCoordinator` are product/runtime concerns and should survive the framework migration.

External docs checked:

- Microsoft Agent Framework providers: https://learn.microsoft.com/en-us/agent-framework/agents/providers/
- Microsoft Agent Framework overview: https://learn.microsoft.com/en-us/agent-framework/overview/
- Microsoft.Extensions.AI: https://learn.microsoft.com/en-us/dotnet/ai/ai-extensions
- OpenAI Responses/API tools and models: https://platform.openai.com/docs/api-reference/responses, https://developers.openai.com/api/docs/models
- Anthropic models, structured outputs, thinking, embeddings: https://platform.claude.com/docs/en/about-claude/models/overview, https://platform.claude.com/docs/en/build-with-claude/structured-outputs, https://platform.claude.com/docs/en/build-with-claude/extended-thinking, https://docs.anthropic.com/en/docs/build-with-claude/embeddings
- Anthropic procurement routes: https://docs.anthropic.com/en/api/claude-on-amazon-bedrock, https://docs.anthropic.com/en/api/claude-on-vertex-ai, https://learn.microsoft.com/en-us/azure/foundry/foundry-models/how-to/use-foundry-models-claude
- Gemini models, function calling, structured outputs, embeddings, SDKs: https://ai.google.dev/gemini-api/docs/models/gemini-v2, https://ai.google.dev/gemini-api/docs/function-calling, https://ai.google.dev/gemini-api/docs/structured-output, https://ai.google.dev/gemini-api/docs/embeddings, https://ai.google.dev/gemini-api/docs/downloads, https://github.com/googleapis/dotnet-genai
- Ollama Agent Framework provider: https://learn.microsoft.com/en-us/agent-framework/agents/providers/ollama

## Agent Framework Provider Matrix

This is the Agent Framework view of provider choice. It starts with the framework adapter HMC would code against, then maps to model families and procurement routes.

| Agent Framework provider | Model families covered | Inference/provider surface | HMC use | Caveats |
|---|---|---|---|---|
| Azure OpenAI | OpenAI GPT / reasoning models deployed in Azure. | Azure OpenAI resource and deployments. | Default Phase 1 enterprise path for Aivy chat, streaming, function tools, structured output, and optional hosted tools. | Deployment names, quota, region, and API surface need to live in `ModelProfile`. |
| OpenAI | OpenAI GPT / reasoning models from OpenAI direct. | OpenAI platform API. | Lowest-friction direct SDK path and useful non-Azure comparison target. | Production use depends on procurement/data policy. Keep separate from Azure OpenAI even if model names match. |
| Microsoft Foundry | OpenAI and Foundry-hosted partner/community models; current docs include Claude preview support. | Microsoft Foundry project/model deployments and managed agents. | Enterprise procurement route and possible long-term managed-agent option. | More service-managed behavior. Validate history, persistence, hosted tools, quotas, and regions before replacing local orchestration. |
| Anthropic | Claude model family. | Anthropic direct API through Agent Framework Anthropic provider. | Phase 3 primary reasoning alternative after OpenAI/Azure parity. | No Anthropic embeddings. Package/API shape and thinking/tool controls must be isolated behind profiles. |
| Ollama | Open-weight/local models such as Llama/Mistral/Qwen depending on local pulls. | Local Ollama endpoint through `Microsoft.Extensions.AI.Ollama`. | Local development, offline evaluation, and privacy-sensitive spikes. | Not a production default. No hosted tools/background responses; HMC owns model ops and quality. |
| Foundry Local | Supported local Foundry models. | Foundry Local runtime. | Watch for local/offline developer workflows. | Current provider comparison shows limited features; validate .NET availability before planning around it. |
| GitHub Copilot | Copilot-routed model access. | GitHub Copilot provider. | Developer-facing assistant workflows only. | Not the production ChatAI backend; licensing and identity model differ. |
| Copilot Studio | Copilot Studio agents. | Copilot Studio agent integration. | Enterprise bot handoff/integration target. | Not the core Aivy runtime; weak fit for HMC-owned SmartSearch2/persistence. |
| Custom `IChatClient` | Gemini, Bedrock routes, Vertex routes, other catalog/self-hosted models. | Any `Microsoft.Extensions.AI.IChatClient` HMC implements or adopts. | Escape hatch for Gemini and provider routes not covered by first-party Agent Framework providers. | Treat as a spike until streaming, tools, structured output, cancellation, telemetry, and SmartSearch2 parity are proven. |

Registry implication:

| Registry field | Meaning |
|---|---|
| `ModelProvider` | Owner/family of the model: `OpenAI`, `Anthropic`, `Google`, `OpenWeights`, `Other`. |
| `InferenceProvider` | Call/procurement route: `AzureOpenAI`, `OpenAIDirect`, `MicrosoftFoundry`, `AnthropicDirect`, `AWSBedrock`, `GoogleVertexAI`, `GoogleAI`, `Ollama`, `GitHubCopilot`, `CopilotStudio`, `Custom`. |
| `FrameworkProvider` | Agent Framework adapter: `AzureOpenAI`, `OpenAI`, `MicrosoftFoundry`, `Anthropic`, `Ollama`, `FoundryLocal`, `GitHubCopilot`, `CopilotStudio`, or `CustomIChatClient`. |
| `ModelProfile` | Concrete selectable profile tying together model id, deployment id, inference route, framework adapter, capability flags, compliance approval, quotas, and cost metadata. |

## Provider Capability Matrix

Legend:

- Strong: first-class fit for HMC near-term use.
- Usable: viable with adapter/policy work.
- Watch: promising but should not gate Phase 1.
- Gap: do not rely on this provider for that capability yet.

| Capability | OpenAI / Azure OpenAI | Anthropic Claude | Google Gemini | HMC stance |
|---|---|---|---|---|
| Agent Framework .NET provider | Strong. `Microsoft.Agents.AI.OpenAI` and Azure equivalents support chat, Responses, hosted tools, and Agent Framework primitives. | Usable/Watch. Agent Framework docs list Anthropic support, but .NET package references still show prerelease installation guidance. | Usable with adapter. Agent Framework can use any `IChatClient`; Gemini may need Google GenAI SDK + custom/third-party `IChatClient` bridge. | OpenAI/Azure is the lowest-risk Phase 1 path. Add Anthropic behind a feature flag. Treat Gemini as a secondary provider until the .NET bridge is settled. |
| Text chat | Strong. Existing service already depends on OpenAI SDK patterns. | Strong. Current Claude models support text input/output and are strong for reasoning/knowledge work. | Strong. Gemini text generation is mature. | All providers should support Aivy core chat. |
| Image/multimodal input | Strong. Current OpenAI models support text and image input. | Strong. Claude models support text/image input; newer Opus models improve high-resolution image handling. | Strong. Gemini is especially strong across image, audio, video, PDF, and long-context inputs. | Keep HMC extraction pipeline provider-neutral. Use Gemini selectively for multimodal experiments after core agent parity. |
| Streaming | Strong. Supported by OpenAI SDK and Agent Framework streaming. | Strong. Claude Messages API streams SSE events, including tool and thinking deltas. | Strong. Gemini supports streaming content and structured-output chunks. | `ChatContext.SignalDataBlock` remains the frontend contract. Provider streaming maps into that contract. |
| Function/tool calling | Strong. Supports function tools and hosted tools through Responses. | Strong. Claude supports tools/tool choice and strict tool use on current models. | Strong. Gemini 2.5/3 families support function calling; selected models support parallel/compositional calls. | Replace `ToolCallAccumulator` and manual dispatch with Agent Framework tool invocation. |
| Strict tool schema | Strong. OpenAI structured outputs with `strict: true` enforce tool argument schema on compatible models. | Strong on supported current Claude models via strict tool use. | Usable. Function-calling modes and schema adherence are model-specific; Gemini docs call out stronger guarantees in constrained modes. | Move schema generation to Agent Framework/`AIFunctionFactory`, but keep validation at HMC boundaries. |
| Structured final output | Strong. OpenAI structured outputs support JSON schema response formats on current models. | Strong on supported Claude models via `output_config.format`. | Strong. Gemini supports JSON Schema structured outputs and streaming partial JSON. | Use for Reflect/introspection and downstream API workflows. Prefer schema-based output over prompt-only JSON. |
| Hosted web/file/code tools | Strong. OpenAI/Azure Responses surface is best aligned with hosted web search, file search, code interpreter, MCP, and background responses. | Mixed. Agent Framework provider table lists code interpreter and MCP, but not file search/background responses. | Mixed/Watch. Gemini has native tools such as Google Search, URL context, code execution, and file search, but Agent Framework/.NET integration needs validation. | Do not replace HMC SmartSearch2 with hosted provider search. Hosted tools are optional augmentations, not the HMC RAG backbone. |
| MCP tools | Strong through Agent Framework/OpenAI provider surface. | Strong per Agent Framework provider matrix. | Watch. Possible through custom integration, but not the first planning assumption. | MCP is future optional. HMC internal tools should first be normal `AIFunction`s. |
| Background / async responses | Strong on OpenAI/Azure provider matrix. | Gap in Agent Framework provider matrix. | Watch. Provider-native support may exist, but Agent Framework/.NET path needs proof. | Keep `ChatCoordinator` and existing distributed cancellation/persistence semantics. |
| Embeddings | Strong. OpenAI embeddings are mature and fit current vectorization patterns. | Gap. Anthropic docs state Anthropic does not offer its own embedding model; they point users to other embedding providers. | Strong. Gemini `gemini-embedding-001` supports configurable 128-3072 dimensions. | Chat provider and embedding provider should be separate choices. Anthropic can be primary for chat while OpenAI/Gemini remains embedding provider. |
| Long context | Strong on latest OpenAI models. | Strong on latest Claude Opus/Sonnet models with 1M context on selected models. | Strong. Gemini 2.5 Pro documents 1,048,576 input tokens. | Long context reduces pressure but does not eliminate HMC truncation/persistence controls. |
| Reasoning / thinking controls | Strong. OpenAI model-specific reasoning effort needs a provider policy layer. | Strong. Claude has adaptive/extended thinking depending on model. | Strong. Gemini 2.5/3 models expose thinking behavior. | Keep a provider-neutral `ReasoningProfile`, mapped to provider-specific knobs. Do not scatter provider `if` logic through controllers. |
| Data residency / enterprise procurement | Strongest via Azure OpenAI / Microsoft Foundry. | Strong if procured through approved Anthropic direct, Bedrock, Vertex, or Microsoft Foundry paths. | Strongest through Vertex AI / Google Cloud procurement if approved. | Provider routing must include compliance metadata, not only model names. |
| .NET implementation friction | Lowest. Current service already uses OpenAI .NET SDK and Agent Framework OpenAI package is mature. | Medium. Agent Framework support exists, but package maturity and Foundry/Bedrock/Vertex paths need spike. | Medium/high. Official Google GenAI SDK supports C#, but Agent Framework integration likely needs an `IChatClient` adapter validation. | Sequence implementation OpenAI -> Anthropic -> Gemini. |

## Recommended Provider Roles

| Role | Provider | Why |
|---|---|---|
| Phase 1 migration provider | Azure OpenAI / OpenAI | Best Agent Framework parity, closest to current code, strongest hosted tool support, easiest migration path. |
| First-class second provider | Anthropic Claude | Strong model quality, long-context options, structured output, streaming, thinking controls, and provider diversity. |
| Stretch provider | Gemini | Strong long-context and multimodal capability, strong embeddings, useful cost/performance comparator, but needs .NET/Agent Framework integration validation. |
| Embeddings default | OpenAI or Gemini | Anthropic is not an embedding provider. Keep embeddings independently routable. |
| HMC RAG backbone | Existing HMC indexing + SmartSearch2/Azure AI Search | Provider hosted search should not replace the extraction -> chunk -> embed -> index pipeline. |

## HMC Abstraction Boundary

Use Agent Framework as the orchestration abstraction. Do not build a second agent framework inside HMC.

Recommended new boundary:

- `HMC.Shared.AI` or local equivalent owns provider/client DI canonicalization.
- `HMC.ChatAI.Service` owns Aivy instructions, tools, SignalR, persistence, user profile, document extraction, SmartSearch2 semantics, and policy.
- Provider-specific policy is centralized in one model/provider registry.

Suggested local concepts:

| Concept | Purpose |
|---|---|
| `ModelProvider` | Model owner/family: `OpenAI`, `Anthropic`, `Google`, `OpenWeights`, `Other`. |
| `InferenceProvider` | Runtime/procurement route: `AzureOpenAI`, `OpenAIDirect`, `MicrosoftFoundry`, `AnthropicDirect`, `AWSBedrock`, `GoogleVertexAI`, `GoogleAI`, `Ollama`, `GitHubCopilot`, `CopilotStudio`, `Custom`. |
| `FrameworkProvider` | Agent Framework or `IChatClient` adapter selected by the profile. |
| `ModelProfile` | Friendly model alias, model provider, inference provider, framework provider, deployment/model id, max context, max output, supports tools, supports structured output, supports vision, supports thinking, supports hosted tools, procurement/compliance metadata. |
| `ReasoningProfile` | Provider-neutral values such as `Default`, `Concise`, `Thinking`, `Deep`, mapped to OpenAI reasoning effort, Claude effort/thinking, or Gemini thinking configuration. |
| `AivyAgentFactory` | Builds the single Aivy `AIAgent` for a request using profile, user instructions, tools, middleware, and run/session options. |
| `AivyToolRegistry` | Converts HMC-owned tools into Agent Framework `AIFunction`s. |
| `AivyAgentRunService` | Replaces most of `ChatJob` orchestration while preserving storage, SignalR, cancellation, and closeout semantics. |

## Code Cull Map

These are planning targets, not immediate edits.

| Current code | Target state | Notes |
|---|---|---|
| `IChatFunction` | Replace with `AIFunction` delegates or typed tool classes. | Keep a temporary adapter so tools can migrate one at a time. |
| `IChatFunction.WrapAsync(string)` | Remove after tools expose typed methods. | JSON string parsing should move to framework schema binding or narrow adapters. |
| `ToolCallAccumulator` | Delete after Agent Framework tool invocation is authoritative. | Current code exists only because streaming raw OpenAI tool call fragments are manually accumulated. |
| `FunctionCallingContext` | Replace with runtime context injection / closures / middleware metadata. | Preserve user id, chat id, message id, nudge, and use-blocks semantics in a request context object. |
| `IStreamingFunction` / `IBlockStreamingFunction` / `IStatusEmitterFunction` | Replace with function middleware plus explicit HMC tool event sink for long-running tools. | SmartSearch2 block streaming needs careful adapter support before deleting these interfaces. |
| `ChatJob` manual OpenAI loop | Replace with `AivyAgentRunService` invoking `agent.RunAsync` / streaming run. | `ChatJob` can remain as facade during cutover to avoid controller churn. |
| `ReflectService` manual tool loop | Replace with stateless agent invocation using same tool registry. | Good early candidate after main streaming path proves tool parity. |
| `FunctionExtensions.GetHMCFunctions` / `AddReflective<TTool>` | Replace with `AivyToolRegistry` using `AIFunctionFactory.Create`. | Retain schema reflection only if needed for tools not expressible via typed delegates. |
| `PromptEngineeringProvider.AsChatMessageSequence` | Shrink into instruction/history construction or custom history provider. | Do not delete until Cosmos `ChatHistory` parity is proven. |
| `ChatHistoryTokenTruncation` and truncation policies | Keep initially. Maybe retire later behind custom history provider. | Agent Framework memory/history is not a substitute for HMC Cosmos payload limits. |
| `ModelCapabilities` / `ModelPromptConstraints` | Convert into provider/model policy registry, not a full delete. | Provider behavior still varies too much to remove policy. |
| `OpenAiPayloadShapingPolicy` | Move to provider-specific chat client middleware or delete if framework handles it. | Keep until OpenAI Responses path is stable. |
| `PromptService` / `PromptRepository` | Reduce if prompts become agent instructions/config. | Azure App Configuration prompts still matter; do not force all prompts into code. |
| `WorkingMemory` | Replace only if Agent Framework memory providers meet HMC needs. | Existing profile memory is product data; migrate deliberately. |
| `VectorizationService` | Stays. | Agent memory providers may query context; they do not own extraction/chunk/embed/index production. |
| Data extraction, document analysis, chunking, thumbnails | Stays. | Not an agent concern. |
| `ChatContext` | Stays. | It is the SignalR/UI contract. Middleware calls into it. |
| `ChatCoordinator` | Stays. | It owns distributed stop/cancellation/persistence coordination. |
| `EMailAiCoordinator` | Stays. | It owns e-mail thread concurrency, not model orchestration. |

## Migration Plan

### Phase 0: Capture and Feature Flags

- Add the Agent Framework provider matrix and model policy registry as planning artifacts.
- Add a runtime switch such as `AgentFramework:Enabled`.
- Add provider selection settings:
  - `AgentFramework:DefaultInferenceProvider`
  - `AgentFramework:DefaultModelProfile`
  - `AgentFramework:ThinkingModelProfile`
  - `AgentFramework:ConciseModelProfile`
  - `AgentFramework:EmbeddingModelProfile`
  - `AgentFramework:AllowedInferenceProviders`
- Decide whether production uses direct OpenAI, Azure OpenAI, Microsoft Foundry, direct Anthropic, Anthropic through Foundry/Bedrock/Vertex, or Gemini through Google AI/Vertex.

### Phase 1: Single Aivy Agent on OpenAI/Azure OpenAI

- Add Agent Framework OpenAI package.
- Build `AivyAgentFactory`.
- Wrap existing `WebSearchFunction` and `SmartSearch2Function` through compatibility adapters.
- Keep `ChatJob` as a facade, but route a feature-flagged path to `AivyAgentRunService`.
- Preserve:
  - `ChatContext.SignalChatStart`
  - `ChatContext.SignalDataBlock`
  - `ChatContext.SignalChatStatusMessage`
  - `ChatContext.SignalChatStop`
  - `ChatCoordinator` cancellation
  - Cosmos persistence and `ChatHistory` shape
- Acceptance criteria:
  - Normal chat streams to current UI.
  - WebSearch works.
  - SmartSearch2 emits the same visible blocks and persisted answer shape.
  - Stop streaming still works.
  - Ask-Aivy still sends a coherent e-mail response.

### Phase 2: Provider Abstraction, Tool, and Prompt Cleanup

- Convert tools from JSON-string `WrapAsync` to typed methods where practical.
- Replace reflective schema generation with `AIFunctionFactory.Create`.
- Move status emission into function middleware and/or a tool event sink.
- Collapse duplicated tool loops in `ChatJob` and `ReflectService`.
- Keep one compatibility adapter only for tools that stream internal HMC blocks.

### Phase 3: Anthropic First-Class Provider

- Add Anthropic provider package or approved `IChatClient` path behind feature flag.
- Map `ReasoningProfile` to Claude thinking/effort controls.
- Validate:
  - tool calling
  - structured output
  - streaming
  - SmartSearch2 tool result behavior
  - token accounting and truncation heuristics
  - data retention/procurement path
- Promote Claude profiles for workloads where it wins on quality or cost.

### Phase 4: Gemini Stretch Provider

- Add official `Google.GenAI` SDK and/or an `IChatClient` bridge.
- Validate Agent Framework compatibility before making Gemini selectable in production.
- Use Gemini first for:
  - large-context document/chat experiments
  - multimodal extraction comparisons
  - embedding quality/cost comparison
  - provider failover drills
- Do not block Phase 1 or Phase 3 on Gemini.

### Phase 5: Memory / RAG Revisit

- Keep HMC extraction, chunking, embedding, and Azure AI Search indexing pipeline.
- Consider Agent Framework context providers only as a query-time retrieval abstraction.
- Do not replace SmartSearch2 until:
  - citations/source blocks survive
  - UI blocks survive
  - permissions/filters survive
  - indexing sweep remains independent
  - retrieval quality is measured against current behavior

### Phase 6: Delete Legacy Orchestration

Delete only after parity and rollback window:

- `ToolCallAccumulator`
- `FunctionCallingContext`
- `IChatFunction` compatibility layer
- `IStreamingFunction` / `IBlockStreamingFunction` / `IStatusEmitterFunction`
- raw OpenAI chat-completions streaming loop in `ChatJob`
- manual tool loop in `ReflectService`
- obsolete prompt/model compatibility shims

## Provider Routing Policy

Use a model profile router, not controller-level `if` blocks.

Suggested routing rules:

| Workload | Preferred provider | Fallback |
|---|---|---|
| Default Aivy chat | OpenAI/Azure OpenAI initially; Anthropic after Phase 3 validation | Alternate primary provider |
| Thinking/deep reasoning | Anthropic Claude or OpenAI reasoning model, selected by measured quality/cost | Other primary provider |
| Short/concise answers | Lower-cost OpenAI or Claude fast model | Gemini Flash-class model after validation |
| SmartSearch2 synthesis | Start with current configured model family | Alternate primary provider only after answer quality test |
| Reflect / structured API response | OpenAI or Anthropic with strict schema support | Gemini after structured-output bridge validation |
| Embeddings/vectorization | OpenAI or Gemini | Never Anthropic unless Anthropic ships embeddings later |
| Multimodal long-context experiments | Gemini | Claude/OpenAI depending on content |

## Risk Register

| Risk | Mitigation |
|---|---|
| Provider feature parity is uneven. | Centralize `ModelProfile` capabilities and reject incompatible request options early. |
| SmartSearch2 loses UI block semantics. | Treat SmartSearch2 as the parity gate for Phase 1. Keep a streaming tool event adapter. |
| Agent Framework memory conflicts with HMC persistence. | Keep Cosmos `ChatHistory` authoritative until a custom history provider proves parity. |
| Anthropic package/API shape changes while prerelease. | Feature-flag provider and isolate Anthropic code behind `IChatClient`/agent factory. |
| Gemini lacks a clean first-party Agent Framework .NET provider path. | Use a secondary-provider spike with official `Google.GenAI` and an `IChatClient` adapter. |
| Long context tempts removal of truncation too early. | Keep token and Cosmos payload truncation until load tests prove safe margins. |
| Model provider and inference provider get conflated. | Keep `ModelProvider`, `InferenceProvider`, and `FrameworkProvider` separate in the registry. |
| Data flows to unapproved providers. | Add provider procurement/compliance metadata to model profiles and block unapproved profiles by environment. |
| Hosted provider tools bypass HMC permissions. | Keep HMC-owned tools for internal data. Hosted tools require separate security review. |

## Immediate Next Steps

1. Add `AgentFramework:Enabled=false` and provider profile settings.
2. Add a small `AivyAgentFactory` spike using OpenAI/Azure OpenAI only.
3. Build an `IChatFunction` to `AIFunction` compatibility adapter.
4. Run the spike against WebSearch and SmartSearch2.
5. Capture parity gaps before deleting any legacy orchestration.

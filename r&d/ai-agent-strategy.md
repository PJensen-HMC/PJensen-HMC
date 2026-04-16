# HMC AI Agent Strategy

**Date:** 2026-04-16  
**Author:** Pete Jensen  
**Status:** Decision document  
**Research artifacts:** `semantic-kernel-spike.md`, `agent-framework-spike.md`

---

## Migration: `HMC.ChatAI.Service` → Agent Framework

Current state: raw OpenAI .NET SDK (`OpenAI.Chat.ChatClient`). Target: **Microsoft Agent Framework (`Microsoft.Agents.AI`)** — GA April 3, 2026. No SK detour.

### Code That Goes Away

| Current | Replacement |
|---|---|
| `IChatFunction` + `WrapAsync()` | `AIFunctionFactory.Create(delegate)` |
| `IStreamingFunction.ChunkReceived` | middleware pipeline hook |
| `IStatusEmitterFunction.StatusChanged` | middleware pipeline → `ChatContext.SignalChatStatusMessage` |
| `FunctionCallingContext` | framework-managed |
| `ToolCallAccumulator` | handled internally |
| `ChatJob` (tool dispatch loop) | `agent.RunAsync()` / `InvokeStreamingAsync()` |
| `PromptEngineeringProvider` | middleware pipeline (pre-send mutation) |
| `PromptTemplateService` / `PromptRepository` | agent `instructions` + runtime-composed strings |
| `WorkingMemory` | memory provider (vector retrieval) |
| `VectorizationService` | memory provider (vector backend) |
| `ChatHistory` + 5 truncation strategies | framework conversation threading + memory providers |
| `ModelCapabilities` / `ModelPromptConstraints` | per-agent model selection via `IChatClient` |

### Code That Stays

| Component | Reason |
|---|---|
| `ChatContext` (SignalR signals) | Transport layer — middleware calls into it |
| `ChatCoordinator` (distributed cancel, semaphores) | Concurrency concern outside agent scope |
| `DataExtractionServices` (PDF, Office, audio, HTML) | Domain-specific; wrap as tools |
| `DocumentAnalysis` / chunking / Document Intelligence | Custom pipeline; expose as tools |
| `EMailAiCoordinator` / AskAivy | Becomes `agent.RunAsync()` call |
| Cosmos + Blob persistence | Survives; memory providers sit on top |
| Auth / user profile middleware | ASP.NET Core concern, unchanged |

### Migration Phases

**Phase 1 — Single agent, tool calling** *(replace today's ChatJob loop)*
- `IChatFunction` registrations → `AIFunctionFactory.Create()` tools
- `ToolCallAccumulator` + dispatch loop → `agent.RunAsync()`
- `ChatContext.Signal*` wired into agent middleware

**Phase 2 — Memory / RAG**
- `VectorizationService` + raw Azure AI Search → Agent Framework memory provider
- `SmartSearch2Function` → memory-backed retrieval tool or memory provider

**Phase 3 — Named agents** *(optional architecture evolution)*
- Split Aivy into focused agents: `OfficeAssistantAgent`, `SearchAgent`, `LearningAgent`
- `HandoffOrchestration` — triage agent routes per intent

**Phase 4 — Multi-agent** *(future)*
- `GroupChatOrchestration` or `MagenticOneOrchestration` for complex cross-domain tasks

---

## Key Migration Examples

### Tools — replacing `IChatFunction`

```csharp
// Was: SmartSearch2Function : IChatFunction
var smartSearchTool = AIFunctionFactory.Create(
    async (string query, string? filters) =>
        await smartSearchService.SearchAsync(query, filters),
    name: "smart_search",
    description: "Search the HMC knowledge base and document library");

// Was: CalendarFunction : IChatFunction
var calendarTool = AIFunctionFactory.Create(
    async (string userId, DateTimeOffset start, DateTimeOffset end) =>
        await calendarService.GetEventsAsync(userId, start, end),
    name: "get_calendar_events",
    description: "Get calendar events for the current user");

// Was: SendMailFunction : IChatFunction
var sendMailTool = AIFunctionFactory.Create(
    async (string to, string subject, string body) =>
        await mailService.SendAsync(to, subject, body),
    name: "send_email",
    description: "Send an email on behalf of the user");

// Was: UserProfileFunction : IChatFunction
var userProfileTool = AIFunctionFactory.Create(
    async (string userId) => await userProfileService.GetAsync(userId),
    name: "get_user_profile",
    description: "Get the current user's profile and preferences");
```

### Agent — replacing `ChatJob` + `PromptService`

```csharp
// Was: ChatJob orchestrating PromptService + IChatFunction dispatch loop
var aivy = new AIProjectClient(new Uri(endpoint), new DefaultAzureCredential())
    .AsAIAgent(
        model: runtimeSettings.ModelDeployment,
        name: "Aivy",
        instructions: promptEngineeringProvider.BuildSystemPrompt(userProfile),
        tools: [smartSearchTool, calendarTool, sendMailTool, userProfileTool, webSearchTool]);
```

### Middleware — replacing `IStreamingFunction` / `IStatusEmitterFunction`

```csharp
// Was: SmartSearch2Function : IStatusEmitterFunction + event StatusChanged
aivy.Use(async (context, next) =>
{
    // pre-tool: signal to client (was IStatusEmitterFunction.StatusChanged)
    if (context.FunctionName is not null)
        await chatContext.SignalChatStatusMessage(LogLevel.Information,
            GetStatusMessage(context.FunctionName)); // "Searching documents...", "Checking calendar..."

    await next(context);

    // post-tool: resume streaming indicator (was IStreamingFunction.ChunkReceived pattern)
});
```

### Streaming via SignalR — replacing `ChatJob` streaming loop

```csharp
// Was: ChatJob.RunAsync() → manual delta accumulation → ChatContext.SignalChatDelta
public async Task SendMessage(string chatId, string userId, string message,
    CancellationToken cancellationToken)
{
    var cts = chatCoordinator.GetOrCreateCancellationToken(chatId);

    await chatContext.SignalChatStart();

    await foreach (var chunk in aivy.InvokeStreamingAsync(message, cancellationToken: cts.Token))
    {
        await chatContext.SignalDataBlock("text", "markdown", chunk.Content);
    }

    await chatContext.SignalChatStop();
    await chatCoordinator.CleanupAsync(chatId);
}
```

### AskAivy — replacing `EMailAiCoordinator`

```csharp
// Was: EMailAiCoordinator.ProcessAsync() → custom OpenAI call chain
public async Task<string> ProcessEmailAsync(string emailBody, string senderId)
{
    var aivy = BuildAivyAgent(userProfile: await userProfileService.GetAsync(senderId));
    return await aivy.RunAsync(emailBody);
}
```

---

## Shared Library Opportunity

`HMC.Shared.AgentCore` — follows `HMC.Shared.Web/ServiceExtensions.cs` pattern:

```csharp
public static class AgentServiceExtensions
{
    public static IServiceCollection AddHMCAIAgent(
        this IServiceCollection services,
        IConfiguration config,
        Action<AgentBuilder>? configure = null)
    {
        // standard HMC Azure Foundry client + agent config
        // standard HMC tools: SmartSearch, Calendar, UserProfile, WebSearch
        // standard HMC middleware: ChatContext SignalR signals, telemetry
    }
}
```

All microservices needing AI adopt HMC-standard agent config in one call.

---

## Landscape (Brief)

```
Semantic Kernel (2023–2025)  ──┐  SK proved the primitives.
                               ├──► Microsoft Agent Framework 1.0
AutoGen (2024–2025)          ──┘  AutoGen proved the orchestration patterns.
```

SK and AutoGen are predecessors. Agent Framework absorbed both, GA'd April 3 as a unified 1.0. Official migration guides from both exist. The two research spikes (`semantic-kernel-spike.md`, `agent-framework-spike.md`) document the full detail if the team wants the backstory.

**NuGet:** `Microsoft.Agents.AI` + `Microsoft.Agents.AI.OpenAI`  
**Foundation:** `Microsoft.Extensions.AI` (`IChatClient`) — swap providers without rewriting agent code  
**Providers:** Azure OpenAI, OpenAI, Anthropic, Bedrock, Gemini, Ollama  
**Multi-agent patterns (all stable 1.0):** sequential, concurrent, handoff, group chat, Magentic-One  
**GitHub:** [microsoft/agent-framework](https://github.com/microsoft/agent-framework)

---

## Decision

| Question | Answer |
|---|---|
| Framework | **`Microsoft.Agents.AI`** |
| Available | GA April 3, 2026 |
| Migration path | Raw OpenAI SDK → Agent Framework directly |
| SK? | Conceptual reference only — no NuGet dependency |
| AutoGen? | Absorbed into Agent Framework — skip |
| Multi-agent now? | No — Phase 1 first |

---

## References

- [Agent Framework 1.0 announcement](https://devblogs.microsoft.com/agent-framework/microsoft-agent-framework-version-1-0/)
- [GitHub: microsoft/agent-framework](https://github.com/microsoft/agent-framework)
- [VSMag: SK + AutoGen = Agent Framework (Oct 2025)](https://visualstudiomagazine.com/articles/2025/10/01/semantic-kernel-autogen--open-source-microsoft-agent-framework.aspx)
- [VSMag: 1.0 ships (Apr 2026)](https://visualstudiomagazine.com/articles/2026/04/06/microsoft-ships-production-ready-agent-framework-1-0-for-net-and-python.aspx)
- [InfoQ: RC writeup](https://www.infoq.com/news/2026/02/ms-agent-framework-rc/)
- [C# deep dive](https://startdebugging.net/2026/04/microsoft-agent-framework-1-0-ai-agents-in-csharp/)

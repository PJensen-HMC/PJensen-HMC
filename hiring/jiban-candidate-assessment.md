# Candidate Assessment: Jiban — Applied AI / Document Intelligence

**Date:** 2026-04-21
**Role fit:** Applied AI Scientist / GenAI Engineer
**Assessed against:** CoreServices ChatAI (Aivy) document intelligence stack

---

## GPT Summary of Resume

AI/ML-heavy resume with linear progression: data science → applied AI → document intelligence / LLM systems → current independent GenAI projects.

**Career arc:**

- **Mantis Technologies** (Jul 2018–Mar 2021) — Data Scientist. Dynamic pricing, fraud detection, recommendations, multilingual intent detection, summarization, behavioral modeling. Stack: RLHF/contextual bandits, causal inference, LSTMs, Kafka, Spark MLlib, RoBERTa, TabTransformer, contrastive learning. Claims ambitious for early-career: "100M+ user events," "RLHF engine," "causal inference" in pricing.
- **Maventech Labs** (Apr–Jul 2021) — Transitional role before grad school. Multilingual chatbot (mBART/T5), large-scale review analytics on Spark/Hadoop.
- **M.S. Applied Artificial Intelligence, Stevens Institute of Technology** (Aug 2021–Dec 2022)
- **WorkFusion intern** (Jul–Dec 2022) — Document AI: OCR, LayoutLM, PDF/image extraction, signature detection (YOLO/VGG), Azure ML deployment. Cleanest bridge from academic AI into applied product.
- **WorkFusion Applied AI Scientist** (Feb 2023–Mar 2025) — Center of resume. Document intelligence, financial datasets, enterprise AI, LLMs, agents, RAG, multimodal, Azure OpenAI, Azure AI Search, Azure Document Intelligence, Azure ML, LangGraph.
  - Self-evolving document intelligence system (fine-tuned LLMs + LayoutLM)
  - Multi-agent labeling ecosystem (LangGraph/RAG/LLMs)
  - Synthetic image generation for rare-class detection
  - Vision-language table structure detection — beat ABBYY by 12%
  - Customer query/review assistant, 100K+ daily requests, persistent memory and retrieval
- **Independent projects** (Jul 2025–present, Dec 2025–present) — Multimodal product intelligence (LLaVA/QLoRA/FAISS/reranking), LLM-powered code intelligence benchmarking GPT-4/Claude/open-source.

**GPT positioning:** Hands-on applied AI scientist / GenAI engineer with strong document AI, retrieval, multimodal, Azure AI, and agentic workflow experience. Not a generic software engineer — builds AI product systems around documents, extraction, labeling, search, reasoning, and automation.

**GPT caution:** Resume is extremely claim-dense. Many bullets combine frontier language, production numbers, revenue impact, and a stack of modern tools. Phrases that need probing: "self-evolving," "multi-step spatial–textual reasoning," "iterative self-reflection loops," "multi-agentic labeling ecosystem," "RLHF engine" at 2018–2021 company, "DeepSeek-R1" inside a role ending March 2025.

---

## Cross-Reference: Candidate vs. ChatAI Stack

### Strong Overlaps — Real Signal

| Candidate Claim | Our Implementation | Assessment |
|---|---|---|
| Azure Document Intelligence OCR | `DocIntelOcrImageToTextExtractor` — `prebuilt-layout`/`prebuilt-document` | Direct match. Probe which models, feature flags, high-res mode. |
| Semantic chunking respecting document structure | `DocumentIntelligenceChunkingStrategy` — section/table/footnote awareness, overlap, sentence breaks | Non-trivial. If he describes structure-aware chunking unprompted, it's real. |
| RAG pipeline | Chunking → `VectorizationService` (OpenAI embeddings, batched, cached) → doc-session context injection | Pattern matches. Depth unclear. |
| GPT-4o multimodal / vision | `MachineVisionImageToTextExtractor`, `MachineVision.cs` — base64 JPEG, gpt-4o | We built this too. Ask what the vision path is for vs. when to fall back to OCR. |
| Tool-calling agentic loops | `ReflectService` — parallel tool execution, re-submit cycle, streaming callbacks | We have this. Ask what "multi-agent" means concretely — LangGraph state machine or just tool iteration? |
| Multi-turn conversation + token management | `ChatJob`, `ChatHistoryTokenTruncation`, SharpToken | Genuine overlap. Ask about truncation policy decisions. |

---

### Candidate Claims We Don't Have — Additive If Real

**Azure AI Search** — our codebase has zero Azure AI Search. We use in-memory doc-session + Redis. If he genuinely knows Azure AI Search (indexing strategy, hybrid search, semantic ranker, chunking for search vs. chunking for context), that's directly additive. Ask him to compare Azure AI Search chunking to embedding-over-raw-chunks. If he can't explain the tradeoffs, it's resume vocabulary.

**Formal evaluation framework** — we have no eval infra (no accuracy metrics, no benchmark harness). He claims 95.4%. If he can describe what corpus, what fields, what metric (precision/recall/F1 at field level?), and how he caught regressions after model updates, that's a genuine gap-filler.

**LayoutLM fine-tuning** — we use Azure DI prebuilt models. We made the pragmatic call. Ask him why he fine-tuned instead of using prebuilt, what the accuracy gap was, and what the dataset/annotation pipeline looked like. If he can't describe the annotation pipeline, he probably didn't own the data work.

**FAISS / vector store** — our RAG embeds float arrays back to the client; no dedicated vector DB in ChatAI. Ask how he'd approach adding a vector store to an existing doc-session architecture vs. building greenfield. Real answer will reference index lifecycle, deletion, filtering by document/session scope.

---

### Claims That Don't Match Our Reality — Probe Hard

**"Self-evolving document intelligence system"** — nothing in our stack self-evolves. No feedback loop, no online learning, no model update pipeline. Ask what this means operationally. Acceptable: confidence threshold → human review queue → periodic fine-tune run. Unacceptable: "the LLM improves over time."

**Azure AI Search** (again) — we don't have it, so we can't validate from shared context. Either he fills a real gap or he name-dropped a service. Interview question: walk me through your indexing strategy — field schema, vector fields, chunking decisions, filter design, semantic ranker config, latency budget.

**"95.4% accuracy"** — we have no eval framework, so we know exactly how hard this is to build and maintain. Push on: what was the test set, how was ground truth labeled, what did accuracy measure (field-level extraction? document classification? table cell?), what happened to accuracy after a model update.

**DeepSeek-R1 inside a role ending March 2025** — DeepSeek-R1 launched January 2025. Two-month window. Possible, but a flex claim. Ask specifically what it was used for vs. GPT-4o and what the evaluation looked like.

**LangGraph** — we have custom tool orchestration (`ReflectService`, streaming callbacks, parallel tool execution). Ask him to describe his LangGraph graph: nodes, edges, conditional routing, state schema, human-in-the-loop integration. If he can draw it, it's real.

---

## Surgical Interview Questions

1. "We use Azure Document Intelligence `prebuilt-layout`. You fine-tuned LayoutLM. Walk me through why you chose fine-tuning and what the annotation pipeline looked like."
2. "Our chunking strategy is structure-aware — respects section boundaries, exempts tables from overlap, uses sentence-safe breaks. Describe your chunking approach without looking at a resume."
3. "We don't have Azure AI Search yet. How would you add it to an existing system where docs are already chunked and embedded in Redis-backed sessions — specifically around index lifecycle when a user deletes a document?"
4. "You said 95.4% accuracy on table extraction. What was the test set? How did you detect regressions after a model update?"
5. "What does 'self-reflection loop' mean in your document validation system — show me the data flow."
6. "Walk me through the WorkFusion document intelligence architecture end to end: ingestion, OCR/layout extraction, chunking, model path, validation loop, human review, evaluation, deployment, monitoring."
7. "Describe one failure mode you hit in production and how you fixed it."

---

## Bottom Line

WorkFusion core (Azure DI → chunking → embedding → multi-turn RAG) is a genuine match to our architecture. If he built it at the depth we built ChatAI, he's a real hire. Inflated claims (self-evolving, RLHF at 2019, DeepSeek-R1 in a 2-month window) are noise. **Azure AI Search and eval framework claims are the most valuable to test** — those are real gaps in our stack and the answers will quickly separate real system experience from polished vocabulary.

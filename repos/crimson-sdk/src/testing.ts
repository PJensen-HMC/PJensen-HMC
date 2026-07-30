import type {
  AIBinding,
  APIBinding,
  ConfigurationBinding,
  CosmosBinding,
  CrimsonSDKEnv,
  NotesBinding,
  NotificationsBinding,
  ServiceBusBinding,
  TasksBinding,
  UniversesBinding,
  WebBinding,
} from "./env.ts";
import type { Fabric } from "./capabilities/fabric.ts";

type MockOverrides = {
  AI?: Partial<AIBinding>;
  API?: Partial<APIBinding>;
  CONFIGURATION?: Partial<ConfigurationBinding>;
  COSMOS?: Partial<CosmosBinding>;
  FABRIC?: Partial<Fabric>;
  NOTES?: Partial<NotesBinding>;
  NOTIFICATIONS?: Partial<NotificationsBinding>;
  SERVICE_BUS?: Partial<ServiceBusBinding>;
  TASKS?: Partial<TasksBinding>;
  UNIVERSES?: Partial<UniversesBinding>;
  WEB?: Partial<WebBinding>;
};

const defaultAI: AIBinding = {
  run: () =>
    Promise.resolve({
      response: "",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    }),
};

const defaultAPI: APIBinding = {
  call: () => Promise.resolve({ status: 200, data: undefined as never }),
};

const defaultConfiguration: ConfigurationBinding = {
  get: () => undefined,
  getIdentity: () => ({
    userId: "test-user-id",
    displayName: "Test User",
    email: "test@example.com",
  }),
  getPolicy: () => ({
    maxAITokensPerRequest: 4096,
    allowedFabricDatasets: ["*"],
  }),
};

const defaultCosmos: CosmosBinding = {
  get: () => Promise.resolve(undefined),
  set: () => Promise.resolve(),
  delete: () => Promise.resolve(),
  increment: () => Promise.resolve(1),
  lock: () => Promise.resolve({ release: () => Promise.resolve() }),
};

const defaultFabric: Fabric = {
  query: () => Promise.resolve({ rows: [], total: 0, hasMore: false }),
};

const defaultNotes: NotesBinding = {
  deposit: (opts) =>
    Promise.resolve({
      noteId: "mock-note-id",
      createdAt: "2026-01-01T00:00:00.000Z",
      subject: opts.subject,
      createdBy: opts.createdBy,
      linkedEntities: opts.linkedEntities ?? [],
    }),
  reindex: () => Promise.resolve(),
  downloadAttachment: (attachmentId) =>
    Promise.resolve({
      attachmentId,
      content: new Uint8Array(),
      contentType: "application/octet-stream",
      fileName: null,
    }),
};

const defaultNotifications: NotificationsBinding = {
  send: () => Promise.resolve(),
};

const defaultServiceBus: ServiceBusBinding = {
  send: () => Promise.resolve(),
};

const defaultTasks: TasksBinding = {
  create: (opts) =>
    Promise.resolve({
      taskId: "mock-task-id",
      createdAt: "2026-01-01T00:00:00.000Z",
      title: opts.title,
      assignedTo: opts.assignedTo,
      status: opts.status ?? "open",
      priority: opts.priority ?? "normal",
    }),
};

const defaultUniverses: UniversesBinding = {
  list: () => Promise.resolve({ universes: [] }),
  constituents: (universeId) =>
    Promise.resolve({
      universeId,
      asOf: "2026-01-01T00:00:00.000Z",
      constituents: [],
    }),
};

const defaultWeb: WebBinding = {
  search: (query) => Promise.resolve({ query, hits: [], estimatedTotal: 0 }),
};

export function createMockEnv(overrides: MockOverrides = {}): CrimsonSDKEnv {
  return {
    AI: { ...defaultAI, ...overrides.AI },
    API: { ...defaultAPI, ...overrides.API },
    CONFIGURATION: { ...defaultConfiguration, ...overrides.CONFIGURATION },
    COSMOS: { ...defaultCosmos, ...overrides.COSMOS },
    FABRIC: { ...defaultFabric, ...overrides.FABRIC },
    NOTES: { ...defaultNotes, ...overrides.NOTES },
    NOTIFICATIONS: { ...defaultNotifications, ...overrides.NOTIFICATIONS },
    SERVICE_BUS: { ...defaultServiceBus, ...overrides.SERVICE_BUS },
    TASKS: { ...defaultTasks, ...overrides.TASKS },
    UNIVERSES: { ...defaultUniverses, ...overrides.UNIVERSES },
    WEB: { ...defaultWeb, ...overrides.WEB },
  };
}

import type {
  AIBinding,
  APIRegistry,
  APIService,
  ConfigurationBinding,
  CosmosBinding,
  CrimsonSDKEnv,
  NotificationsBinding,
  QueueRegistry,
  QueueStats,
  TasksBinding,
  UniversesBinding,
  WebBinding,
} from "./env.ts";
import type { Fabric } from "./capabilities/fabric.ts";
import { RuntimeError } from "./runtime_error.ts";

export type MockAPIService = Partial<APIService>;
export type MockQueueSender = (message: unknown) => void | Promise<void>;
export interface MockQueueBinding {
  send?: MockQueueSender;
  stats?: () => QueueStats | Promise<QueueStats>;
}
export interface MockEnvOverrides {
  AI?: Partial<AIBinding>;
  API?: Record<string, MockAPIService>;
  CONFIGURATION?: Partial<ConfigurationBinding>;
  COSMOS?: Partial<CosmosBinding>;
  FABRIC?: Partial<Fabric>;
  NOTIFICATIONS?: Partial<NotificationsBinding>;
  QUEUES?: Record<string, MockQueueSender | MockQueueBinding>;
  TASKS?: Partial<TasksBinding>;
  UNIVERSES?: Partial<UniversesBinding>;
  WEB?: Partial<WebBinding>;
}

const ok = () => Promise.resolve(new Response(null, { status: 200 }));

export function createMockAPIService(
  overrides: MockAPIService = {},
): APIService {
  const service: APIService = {
    fetch: ok,
    get: ok,
    post: ok,
    put: ok,
    patch: ok,
    delete: ok,
  };
  return Object.freeze({ ...service, ...overrides });
}

function createMockAPIRegistry(
  descriptors: Record<string, MockAPIService> = {},
): APIRegistry {
  const services = new Map(
    Object.entries(descriptors).map((
      [name, service],
    ) => [name, createMockAPIService(service)]),
  );
  return Object.freeze({
    service(name: string): APIService {
      const service = services.get(name);
      if (!service) {
        throw new RuntimeError(`API binding not granted: "${name}"`);
      }
      return service;
    },
  });
}

function createMockQueueRegistry(
  bindings: Record<string, MockQueueSender | MockQueueBinding> = {},
): QueueRegistry {
  const resolve = (binding: string): MockQueueBinding => {
    const configured = bindings[binding];
    if (!configured) {
      throw new RuntimeError(`Queue binding not granted: "${binding}"`);
    }
    return typeof configured === "function" ? { send: configured } : configured;
  };
  return Object.freeze({
    async send<T>(binding: string, message: T): Promise<void> {
      const sender = resolve(binding).send;
      if (!sender) {
        throw new RuntimeError(
          `Queue operation not granted for binding "${binding}": send`,
        );
      }
      await sender(message);
    },
    async stats(binding: string): Promise<QueueStats> {
      const inspect = resolve(binding).stats;
      if (!inspect) {
        throw new RuntimeError(
          `Queue operation not granted for binding "${binding}": stats`,
        );
      }
      return await inspect();
    },
  });
}
const defaultAI: AIBinding = {
  run: () =>
    Promise.resolve({
      response: "",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    }),
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
const defaultNotifications: NotificationsBinding = {
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

export function createMockEnv(overrides: MockEnvOverrides = {}): CrimsonSDKEnv {
  return Object.freeze({
    AI: { ...defaultAI, ...overrides.AI },
    API: createMockAPIRegistry(overrides.API),
    CONFIGURATION: { ...defaultConfiguration, ...overrides.CONFIGURATION },
    COSMOS: { ...defaultCosmos, ...overrides.COSMOS },
    FABRIC: { ...defaultFabric, ...overrides.FABRIC },
    NOTIFICATIONS: { ...defaultNotifications, ...overrides.NOTIFICATIONS },
    QUEUES: createMockQueueRegistry(overrides.QUEUES),
    TASKS: { ...defaultTasks, ...overrides.TASKS },
    UNIVERSES: { ...defaultUniverses, ...overrides.UNIVERSES },
    WEB: { ...defaultWeb, ...overrides.WEB },
  });
}

export type { AIBinding, AIOptions, AIResult } from "./capabilities/ai.ts";
export type {
  APIQueryValue,
  APIRegistry,
  APIRequestOptions,
  APIService,
} from "./capabilities/api.ts";
export type {
  AppPolicy,
  ConfigurationBinding,
  UserIdentity,
} from "./capabilities/configuration.ts";
export type {
  CosmosBinding,
  CosmosLockOptions,
  CosmosSetOptions,
  LockHandle,
} from "./capabilities/cosmos.ts";
export type {
  Fabric,
  FabricQueryOptions,
  FabricQueryResult,
} from "./capabilities/fabric.ts";
export type {
  NotificationPayload,
  NotificationsBinding,
  NotificationSendOptions,
} from "./capabilities/notifications.ts";
export type { QueueRegistry } from "./capabilities/queues.ts";
export type {
  TaskCreateOptions,
  TaskPriority,
  TaskResult,
  TasksBinding,
  TaskStatus,
} from "./capabilities/tasks.ts";
export type {
  Constituent,
  ConstituentsResult,
  Universe,
  UniversesBinding,
} from "./capabilities/universes.ts";
export type {
  WebBinding,
  WebHit,
  WebSearchOptions,
  WebSearchResult,
} from "./capabilities/web.ts";

import type { AIBinding } from "./capabilities/ai.ts";
import type { APIRegistry } from "./capabilities/api.ts";
import type { ConfigurationBinding } from "./capabilities/configuration.ts";
import type { CosmosBinding } from "./capabilities/cosmos.ts";
import type { Fabric } from "./capabilities/fabric.ts";
import type { NotificationsBinding } from "./capabilities/notifications.ts";
import type { QueueRegistry } from "./capabilities/queues.ts";
import type { TasksBinding } from "./capabilities/tasks.ts";
import type { UniversesBinding } from "./capabilities/universes.ts";
import type { WebBinding } from "./capabilities/web.ts";

export interface CrimsonSDKEnv {
  AI: AIBinding;
  API: APIRegistry;
  CONFIGURATION: ConfigurationBinding;
  COSMOS: CosmosBinding;
  FABRIC: Fabric;
  NOTIFICATIONS: NotificationsBinding;
  QUEUES: QueueRegistry;
  TASKS: TasksBinding;
  UNIVERSES: UniversesBinding;
  WEB: WebBinding;
}

export function defineCrimsonApp<T>(
  handler: (env: CrimsonSDKEnv) => Promise<T>,
): (env: CrimsonSDKEnv) => Promise<T> {
  return handler;
}

export type { AIBinding, AIOptions, AIResult } from "./capabilities/ai.ts";
export type {
  APIBinding,
  APICallOptions,
  APICallResult,
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
  NoteDepositOptions,
  NoteResult,
  NotesBinding,
} from "./capabilities/notes.ts";
export type {
  NotificationPayload,
  NotificationsBinding,
  NotificationSendOptions,
} from "./capabilities/notifications.ts";
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
import type { APIBinding } from "./capabilities/api.ts";
import type { ConfigurationBinding } from "./capabilities/configuration.ts";
import type { CosmosBinding } from "./capabilities/cosmos.ts";
import type { Fabric } from "./capabilities/fabric.ts";
import type { NotesBinding } from "./capabilities/notes.ts";
import type { NotificationsBinding } from "./capabilities/notifications.ts";
import type { TasksBinding } from "./capabilities/tasks.ts";
import type { UniversesBinding } from "./capabilities/universes.ts";
import type { WebBinding } from "./capabilities/web.ts";

export interface CrimsonSDKEnv {
  AI: AIBinding;
  API: APIBinding;
  CONFIGURATION: ConfigurationBinding;
  COSMOS: CosmosBinding;
  FABRIC: Fabric;
  NOTES: NotesBinding;
  NOTIFICATIONS: NotificationsBinding;
  TASKS: TasksBinding;
  UNIVERSES: UniversesBinding;
  WEB: WebBinding;
}

export function defineCrimsonApp<T>(
  handler: (env: CrimsonSDKEnv) => Promise<T>,
): (env: CrimsonSDKEnv) => Promise<T> {
  return handler;
}

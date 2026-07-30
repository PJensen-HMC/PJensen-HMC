export type TaskStatus = "open" | "in-progress" | "done";
export type TaskPriority = "normal" | "high" | "critical";

export interface TaskCreateOptions {
  title: string;
  assignedTo: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface TaskResult {
  taskId: string;
  createdAt: string;
  title: string;
  assignedTo: string;
  status: TaskStatus;
  priority: TaskPriority;
}

export interface TasksBinding {
  create(options: TaskCreateOptions): Promise<TaskResult>;
}

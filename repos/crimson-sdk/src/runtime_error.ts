export class RuntimeError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "RuntimeError";
  }
}

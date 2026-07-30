import type { APIService } from "../capabilities/api.ts";
import { RuntimeError } from "../runtime_error.ts";

export interface NoteDepositOptions {
  subject: string;
  content: string;
  createdBy: string;
  linkedEntities?: Array<{ type: string; id: string }>;
}
export interface NoteResult {
  noteId: string;
  createdAt: string;
  subject: string;
  createdBy: string;
  linkedEntities: Array<{ type: string; id: string }>;
}
export interface NotesClient {
  deposit(options: NoteDepositOptions): Promise<NoteResult>;
}

export function createNotesClient(api: APIService): NotesClient {
  return Object.freeze({
    async deposit(options: NoteDepositOptions): Promise<NoteResult> {
      const response = await api.post("/v1/deposit", options);
      if (!response.ok) {
        throw new RuntimeError(`Note deposit failed: HTTP ${response.status}`);
      }
      return await response.json() as NoteResult;
    },
  });
}

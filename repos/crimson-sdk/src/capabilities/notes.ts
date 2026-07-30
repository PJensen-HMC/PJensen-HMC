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

export interface NoteAttachment {
  attachmentId: string;
  content: Uint8Array;
  contentType: string | null;
  fileName: string | null;
}

export interface NoteIndexEntry {
  entryType: string;
  id: string;
}

export interface NoteReindexOptions {
  fireAndForget?: boolean;
  force?: boolean;
  quality?: string;
}

export interface NotesBinding {
  deposit(options: NoteDepositOptions): Promise<NoteResult>;
  downloadAttachment(attachmentId: string): Promise<NoteAttachment>;
  reindex(
    entries: NoteIndexEntry[],
    options?: NoteReindexOptions,
  ): Promise<void>;
}

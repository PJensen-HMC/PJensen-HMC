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

export type IndexEntryType = "Attachment" | "Document" | "Note";
export type IndexQuality = "low" | "med" | "high";
export type UniqueIdentifier = string;

export interface IndexEntry {
  entryType: IndexEntryType;
  id: UniqueIdentifier;
}

export interface ReindexOptions {
  fireAndForget?: boolean;
  force?: boolean;
  quality?: IndexQuality;
  hardDelete?: boolean;
}

export interface NotesBinding {
  deposit(options: NoteDepositOptions): Promise<NoteResult>;
  downloadAttachment(attachmentId: string): Promise<NoteAttachment>;
  reindex(
    entries: IndexEntry[],
    options?: ReindexOptions,
  ): Promise<void>;
}

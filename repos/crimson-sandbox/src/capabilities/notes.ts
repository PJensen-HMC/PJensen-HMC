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

export interface NotesBinding {
  deposit(options: NoteDepositOptions): Promise<NoteResult>;
}

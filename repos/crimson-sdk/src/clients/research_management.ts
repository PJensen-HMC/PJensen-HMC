import type { APIService } from "../capabilities/api.ts";
import { RuntimeError } from "../runtime_error.ts";

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
export interface AttachmentDownload {
  attachmentId: string;
  content: Uint8Array;
  contentType: string | null;
  fileName: string | null;
}
export interface ResearchManagementClient {
  downloadAttachment(attachmentId: string): Promise<AttachmentDownload>;
  reindex(entries: IndexEntry[], options?: ReindexOptions): Promise<void>;
}

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ENTRY_TYPES = new Set<IndexEntryType>(["Attachment", "Document", "Note"]);

function fileNameFrom(headers: Headers): string | null {
  const disposition = headers.get("Content-Disposition");
  if (!disposition) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  if (utf8) {
    try {
      return decodeURIComponent(utf8);
    } catch {
      return utf8;
    }
  }
  return /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? null;
}

export function createResearchManagementClient(
  api: APIService,
): ResearchManagementClient {
  return Object.freeze({
    async downloadAttachment(
      attachmentId: string,
    ): Promise<AttachmentDownload> {
      if (!attachmentId.trim()) {
        throw new RuntimeError("Attachment identifier is required");
      }
      const response = await api.get(
        `/api/v1/Attachments/${encodeURIComponent(attachmentId)}`,
        { headers: { Accept: "*/*" } },
      );
      if (!response.ok) {
        throw new RuntimeError(
          `Attachment download failed: HTTP ${response.status}`,
        );
      }
      return {
        attachmentId,
        content: new Uint8Array(await response.arrayBuffer()),
        contentType: response.headers.get("Content-Type"),
        fileName: fileNameFrom(response.headers),
      };
    },
    async reindex(
      entries: IndexEntry[],
      options: ReindexOptions = {},
    ): Promise<void> {
      if (entries.length === 0) {
        throw new RuntimeError("At least one index entry is required");
      }
      for (const entry of entries) {
        if (!ENTRY_TYPES.has(entry.entryType)) {
          throw new RuntimeError(
            `Invalid index entry type: "${entry.entryType}"`,
          );
        }
        if (!GUID.test(entry.id)) {
          throw new RuntimeError(
            `Invalid index entry identifier: "${entry.id}"`,
          );
        }
      }
      const query: Record<string, boolean | IndexQuality> = {};
      if (options.fireAndForget !== undefined) {
        query.fireAndForget = options.fireAndForget;
      }
      if (options.force !== undefined) query.force = options.force;
      if (options.quality !== undefined) query.quality = options.quality;
      if (options.hardDelete !== undefined) {
        query.hardDelete = options.hardDelete;
      }
      const response = await api.patch("/api/v1/Indexing", entries, {
        query,
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json-patch+json",
        },
      });
      if (!response.ok) {
        throw new RuntimeError(`Bulk reindex failed: HTTP ${response.status}`);
      }
    },
  });
}

import { assertEquals } from "@std/assert";
import {
  createEnv,
  type CrimsonSDKEnv,
  StaticTokenProvider,
} from "../../src/mod.ts";

const RUN_INTEGRATION =
  Deno.env.get("RUN_CRIMSON_NOTES_ATTACHMENT_INTEGRATION") === "1";
const DEFAULT_ID_FILE =
  "C:\\Users\\jensenp\\AppData\\Local\\Temp\\missing_2026_note_attachment_ids.txt";
const NOTES_BASE_URL =
  "https://crimson.hmc.harvard.edu/hmc-researchmanagement/api";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_ATTEMPTS = 3;
// deno-lint-ignore no-control-regex -- Windows forbids these filename characters.
const INVALID_FILE_NAME_CHARACTERS = /[<>:"/\\|?*\u0000-\u001f]/g;

interface DownloadResult {
  id: string;
  status: "downloaded" | "skipped" | "failed";
  path?: string;
  error?: string;
}

function loadAttachmentIds(text: string): string[] {
  const ids = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const candidate = line.split("\t", 1)[0].trim();
    if (UUID_PATTERN.test(candidate)) ids.add(candidate.toLowerCase());
  }
  return [...ids];
}

function safeFileName(value: string): string {
  const sanitized = value
    .replace(INVALID_FILE_NAME_CHARACTERS, "_")
    .replace(/[. ]+$/g, "")
    .slice(0, 180);
  return sanitized || "attachment";
}

function joinPath(directory: string, fileName: string): string {
  return `${directory.replace(/[\\/]+$/, "")}/${fileName}`;
}

async function findExistingAttachments(
  outputDirectory: string,
): Promise<Map<string, string>> {
  const existing = new Map<string, string>();
  try {
    for await (const entry of Deno.readDir(outputDirectory)) {
      if (!entry.isFile || entry.name.endsWith(".part")) continue;
      const separator = entry.name.indexOf("--");
      if (separator < 0) continue;
      const id = entry.name.slice(0, separator).toLowerCase();
      if (UUID_PATTERN.test(id)) {
        existing.set(id, joinPath(outputDirectory, entry.name));
      }
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  return existing;
}

function createNotesEnv(token: string): CrimsonSDKEnv {
  return createEnv({
    appIdentity: {
      appId: "notes-attachment-integration-test",
      appName: "Notes attachment integration test",
      tenantId: "hmc",
      grantedScopes: ["crimson.notes"],
    },
    tokens: new StaticTokenProvider({ "crimson.notes": token }),
    serviceUrls: {
      api: NOTES_BASE_URL,
      fabric: NOTES_BASE_URL,
      ai: NOTES_BASE_URL,
      notifications: NOTES_BASE_URL,
      tasks: NOTES_BASE_URL,
      notes: NOTES_BASE_URL,
      universes: NOTES_BASE_URL,
      web: NOTES_BASE_URL,
      cosmos: NOTES_BASE_URL,
    },
    serviceRoutes: {
      notifications: { events: "/unused" },
    },
  });
}

function shouldRetry(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /HTTP (408|429|5\d\d)\b/.test(message);
}

async function downloadAttachment(
  env: CrimsonSDKEnv,
  outputDirectory: string,
  id: string,
  existing: Map<string, string>,
): Promise<DownloadResult> {
  const existingPath = existing.get(id);
  if (existingPath) return { id, status: "skipped", path: existingPath };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const attachment = await env.NOTES.downloadAttachment(id);
      const fileName = `${id}--${safeFileName(attachment.fileName ?? id)}`;
      const path = joinPath(outputDirectory, fileName);
      const partialPath = `${path}.part`;
      await Deno.writeFile(partialPath, attachment.content);
      await Deno.rename(partialPath, path);
      existing.set(id, path);
      return { id, status: "downloaded", path };
    } catch (error) {
      if (attempt === MAX_ATTEMPTS || !shouldRetry(error)) {
        return {
          id,
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        };
      }
      await new Promise((resolve) =>
        setTimeout(resolve, 500 * 2 ** (attempt - 1))
      );
    }
  }

  throw new Error("Unreachable download retry state");
}

async function runPool(
  ids: string[],
  concurrency: number,
  work: (id: string) => Promise<DownloadResult>,
): Promise<DownloadResult[]> {
  const results = new Array<DownloadResult>(ids.length);
  let nextIndex = 0;
  let completed = 0;

  await Promise.all(
    Array.from({ length: Math.min(concurrency, ids.length) }, async () => {
      while (true) {
        const index = nextIndex++;
        if (index >= ids.length) return;
        results[index] = await work(ids[index]);
        completed++;
        if (completed % 100 === 0 || completed === ids.length) {
          console.log(`Processed ${completed}/${ids.length}`);
        }
      }
    }),
  );

  return results;
}

Deno.test({
  name: "NOTES downloads every attachment ID from the recovery list",
  ignore: !RUN_INTEGRATION,
  async fn() {
    const token = Deno.env.get("CRIMSON_NOTES_TOKEN");
    if (!token) {
      throw new Error("CRIMSON_NOTES_TOKEN must contain a fresh bearer token");
    }

    const idFile = Deno.env.get("CRIMSON_NOTES_ATTACHMENT_ID_FILE") ??
      DEFAULT_ID_FILE;
    const outputDirectory = Deno.env.get("CRIMSON_NOTES_ATTACHMENT_OUTPUT") ??
      idFile.replace(/\.txt$/i, "_downloads");
    const concurrency = Number(
      Deno.env.get("CRIMSON_NOTES_ATTACHMENT_CONCURRENCY") ?? "8",
    );
    if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32) {
      throw new Error(
        "CRIMSON_NOTES_ATTACHMENT_CONCURRENCY must be between 1 and 32",
      );
    }

    const ids = loadAttachmentIds(await Deno.readTextFile(idFile));
    if (ids.length === 0) {
      throw new Error(`No attachment IDs found in ${idFile}`);
    }

    await Deno.mkdir(outputDirectory, { recursive: true });
    const existing = await findExistingAttachments(outputDirectory);
    const env = createNotesEnv(token);

    console.log(
      `Downloading ${ids.length} attachments to ${outputDirectory} ` +
        `(${concurrency} concurrent)`,
    );
    const results = await runPool(
      ids,
      concurrency,
      (id) => downloadAttachment(env, outputDirectory, id, existing),
    );

    const manifestPath = joinPath(outputDirectory, "download-manifest.tsv");
    const manifest = [
      "Id\tStatus\tPath\tError",
      ...results.map((result) =>
        [
          result.id,
          result.status,
          result.path ?? "",
          (result.error ?? "").replaceAll("\t", " ").replaceAll(/\r?\n/g, " "),
        ].join("\t")
      ),
    ].join("\n");
    await Deno.writeTextFile(manifestPath, manifest);

    const downloaded = results.filter((result) =>
      result.status === "downloaded"
    );
    const skipped = results.filter((result) => result.status === "skipped");
    const failed = results.filter((result) => result.status === "failed");
    console.log(
      `Done: ${downloaded.length} downloaded, ${skipped.length} skipped, ` +
        `${failed.length} failed. Manifest: ${manifestPath}`,
    );

    assertEquals(
      failed.length,
      0,
      `${failed.length} attachment downloads failed; see ${manifestPath}`,
    );
    assertEquals(downloaded.length + skipped.length, ids.length);
  },
});

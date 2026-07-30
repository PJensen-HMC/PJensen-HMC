import { assertEquals } from "@std/assert";
import { createEnv, StaticTokenProvider } from "../../src/mod.ts";
import {
  createResearchManagementClient,
  type IndexEntry,
} from "../../src/clients/research_management.ts";

const RUN_INTEGRATION =
  Deno.env.get("RUN_CRIMSON_NOTES_REINDEX_INTEGRATION") === "1";
const NOTES_BASE_URL = "https://crimson.hmc.harvard.edu/hmc-researchmanagement";
const DEFAULT_MANIFEST =
  "C:\\Users\\jensenp\\AppData\\Local\\Temp\\missing_2026_note_attachment_ids_downloads\\download-manifest.tsv";

Deno.test({
  name: "NOTES bulk reindexes recovered attachments",
  ignore: !RUN_INTEGRATION,
  async fn() {
    const token = Deno.env.get("CRIMSON_NOTES_TOKEN");
    if (!token) {
      throw new Error("CRIMSON_NOTES_TOKEN must contain a fresh token");
    }
    const manifestPath = Deno.env.get("CRIMSON_NOTES_ATTACHMENT_MANIFEST") ??
      DEFAULT_MANIFEST;
    const lines = (await Deno.readTextFile(manifestPath)).split(/\r?\n/).slice(
      1,
    );
    const entries: IndexEntry[] = lines.flatMap((line) => {
      const [id, status] = line.split("\t", 3);
      return status === "downloaded" || status === "skipped"
        ? [{ entryType: "Attachment", id }]
        : [];
    });
    if (entries.length === 0) throw new Error("No recovered attachments found");

    const env = createEnv({
      appIdentity: {
        appId: "notes-reindex-integration-test",
        appName: "Notes reindex integration test",
        tenantId: "hmc",
        grantedScopes: ["crimson.notes"],
      },
      tokens: new StaticTokenProvider({ "crimson.notes": token }),
      bindingSnapshot: {
        version: "integration-test",
        api: {
          "hmc-researchmanagement": {
            baseUrl: NOTES_BASE_URL,
            auth: { kind: "bearer", scope: "crimson.notes" },
          },
        },
        queues: {},
      },
      secrets: { get: () => undefined },
      serviceUrls: {
        fabric: NOTES_BASE_URL,
        ai: NOTES_BASE_URL,
        notifications: NOTES_BASE_URL,
        tasks: NOTES_BASE_URL,
        universes: NOTES_BASE_URL,
        web: NOTES_BASE_URL,
        cosmos: NOTES_BASE_URL,
      },
      serviceRoutes: { notifications: { events: "/unused" } },
    });
    const research = createResearchManagementClient(
      env.API.service("hmc-researchmanagement"),
    );
    await research.reindex(entries, {
      fireAndForget: true,
      force: true,
      quality: "med",
      hardDelete: false,
    });
    console.log(
      `Submitted ${entries.length} recovered attachments for reindexing`,
    );
    assertEquals(entries.length, 1002);
  },
});

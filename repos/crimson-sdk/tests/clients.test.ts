import { assertEquals, assertRejects } from "@std/assert";
import {
  createNotesClient,
  createResearchManagementClient,
} from "../src/clients/mod.ts";
import type { APIRequestOptions } from "../src/env.ts";
import { createMockAPIService } from "../src/testing.ts";

Deno.test("Research Management downloads the exact attachment route without transcript", async () => {
  let path = "";
  const client = createResearchManagementClient(createMockAPIService({
    get: (value) => {
      path = value;
      return Promise.resolve(
        new Response(new Uint8Array([4, 2]), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=report.pdf",
          },
        }),
      );
    },
  }));
  const result = await client.downloadAttachment(
    "41889919-2FF6-4C2C-8450-D4860ECACC7A",
  );
  assertEquals(
    path,
    "/api/v1/Attachments/41889919-2FF6-4C2C-8450-D4860ECACC7A",
  );
  assertEquals(path.includes("transcript"), false);
  assertEquals(result.content, new Uint8Array([4, 2]));
  assertEquals(result.contentType, "application/pdf");
  assertEquals(result.fileName, "report.pdf");
});

Deno.test("Research Management emits exact bulk indexing payload and options", async () => {
  let path = "";
  let body: unknown;
  let options: APIRequestOptions | undefined;
  const client = createResearchManagementClient(createMockAPIService({
    patch: (requestPath, requestBody, requestOptions) => {
      path = requestPath;
      body = requestBody;
      options = requestOptions;
      return Promise.resolve(new Response(null, { status: 202 }));
    },
  }));
  const entries = [{
    entryType: "Attachment" as const,
    id: "0b67ca3b-1f6a-4e60-a51f-7765e2e08fdc",
  }];
  await client.reindex(entries, {
    fireAndForget: true,
    force: true,
    quality: "med",
    hardDelete: false,
  });
  assertEquals(path, "/api/v1/Indexing");
  assertEquals(body, entries);
  assertEquals(options?.query, {
    fireAndForget: true,
    force: true,
    quality: "med",
    hardDelete: false,
  });
  assertEquals(
    new Headers(options?.headers).get("Content-Type"),
    "application/json-patch+json",
  );
});

Deno.test("Research Management validates indexing entries and propagates HTTP errors", async () => {
  const client = createResearchManagementClient(createMockAPIService({
    patch: () => Promise.resolve(new Response(null, { status: 400 })),
  }));
  await assertRejects(() => client.reindex([]), Error, "At least one");
  await assertRejects(
    () => client.reindex([{ entryType: "Attachment", id: "not-a-guid" }]),
    Error,
    "Invalid index entry identifier",
  );
  await assertRejects(
    () =>
      client.reindex([{
        entryType: "Attachment",
        id: "0b67ca3b-1f6a-4e60-a51f-7765e2e08fdc",
      }]),
    Error,
    "HTTP 400",
  );
});

Deno.test("Notes client composes deposit over APIService", async () => {
  let path = "";
  let body: unknown;
  const expected = {
    noteId: "n-1",
    createdAt: "2026-07-30T00:00:00Z",
    subject: "Subject",
    createdBy: "u-1",
    linkedEntities: [],
  };
  const notes = createNotesClient(createMockAPIService({
    post: (requestPath, requestBody) => {
      path = requestPath;
      body = requestBody;
      return Promise.resolve(Response.json(expected));
    },
  }));
  const input = { subject: "Subject", content: "Body", createdBy: "u-1" };
  assertEquals(await notes.deposit(input), expected);
  assertEquals(path, "/v1/deposit");
  assertEquals(body, input);
});

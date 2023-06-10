import { sql } from "slonik";
import { afterEach, beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PsqlFileReferenceStore } from "../file-reference-store";
import { PsqlMetricsStore } from "../llm-outputs/metrics-store";
import { PsqlProcessedFileStore } from "../processed-file-store";
import { PSqlProjectStore } from "../project-store";
import { ShaHash } from "../sha-hash";
import { PsqlTextChunkStore } from "../text-chunk-store";
import { PsqlUserOrgService } from "../user-org/user-org-service";
import { TEST_SETTINGS } from "./test-settings";

async function setup() {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  const userOrgService = new PsqlUserOrgService(pool);
  const projectService = new PSqlProjectStore(pool);
  const fileReferenceStore = new PsqlFileReferenceStore(pool);
  const processedFileStore = new PsqlProcessedFileStore(pool);

  const user = await userOrgService.upsert({
    sub: {
      provider: "google",
      value: "abc",
    },
    email: "nasr@test.com",
  });

  const project = await projectService.create({
    name: "test-project",
    creatorUserId: user.id,
    organizationId: user.organizationId,
  });

  const fileReference = await fileReferenceStore.insert({
    fileName: "test-file-name.pdf",
    organizationId: project.organizationId,
    projectId: project.id,
    bucketName: "test-bucket",
    contentType: "application/pdf",
    path: "my-path/foo",
  });

  const processedFile = await processedFileStore.upsert({
    organizationId: project.organizationId,
    projectId: project.id,
    fileReferenceId: fileReference.id,
    text: "hi",
    hash: ShaHash.forData("hi"),
  });

  const chunkStore = new PsqlTextChunkStore(pool);

  const textChunkGroup = await chunkStore.upsertTextChunkGroup({
    organizationId: processedFile.organizationId,
    projectId: processedFile.projectId,
    fileReferenceId: processedFile.fileReferenceId,
    processedFileId: processedFile.id,
    numChunks: 2,
    strategy: "greedy_v0",
    embeddingsWillBeGenerated: true,
  });

  const [chunk] = await chunkStore.upsertManyTextChunks(
    {
      organizationId: processedFile.organizationId,
      projectId: processedFile.projectId,
      fileReferenceId: processedFile.fileReferenceId,
      processedFileId: processedFile.id,
      textChunkGroupId: textChunkGroup.id,
    },
    [
      {
        chunkOrder: 0,
        chunkText: "hi",
        hash: ShaHash.forData("hi"),
      },
    ]
  );

  const metricsStore = new PsqlMetricsStore(pool);

  return {
    pool,
    organizationId: user.organizationId,
    userId: user.id,
    projectId: project.id,
    fileReferenceId: fileReference.id,
    processedFileId: processedFile.id,
    textChunkGroupId: textChunkGroup.id,
    textChunkId: chunk.id,
    metricsStore,
  };
}

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);
  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference, processed_file, text_chunk_group, text_chunk, text_chunk_metrics CASCADE`
  );
});

afterEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);
  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference, processed_file, text_chunk_group, text_chunk, text_chunk_metrics CASCADE`
  );
});

test("insertMany", async () => {
  const {
    organizationId,
    projectId,
    fileReferenceId,
    processedFileId,
    textChunkGroupId,
    textChunkId,
    metricsStore,
  } = await setup();

  const [row] = await metricsStore.insertMany([
    {
      organizationId,
      projectId,
      fileReferenceId,
      processedFileId,
      textChunkGroupId,
      textChunkId,
      metrics: { hi: "bye" },
    },
  ]);

  expect(row.metrics).toEqual({ hi: "bye" });
});

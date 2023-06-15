import { sql } from "slonik";
import { afterEach, beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PsqlFileReferenceStore } from "../file-reference-store";
import { PsqlMiscOutputStore } from "../llm-outputs/metrics-store";
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

  const metricsStore = new PsqlMiscOutputStore(pool);

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

  const [financialSummary] = await metricsStore.insertMany([
    {
      organizationId,
      projectId,
      fileReferenceId,
      processedFileId,
      textChunkGroupId,
      textChunkId,
      value: {
        type: "financial_summary",
        value: {
          investmentRisks: ["foo"],
          investmentMerits: ["bar"],
          financialSummaries: ["baz"],
        },
      },
    },
  ]);

  expect(financialSummary.value).toEqual({
    type: "financial_summary",
    value: {
      investmentRisks: ["foo"],
      investmentMerits: ["bar"],
      financialSummaries: ["baz"],
    },
  });

  const [terms] = await metricsStore.insertMany([
    {
      organizationId,
      projectId,
      fileReferenceId,
      processedFileId,
      textChunkGroupId,
      textChunkId,
      value: {
        type: "terms",
        value: [
          {
            termValue: "value",
            termName: "name",
          },
        ],
      },
    },
  ]);

  expect(terms.value).toEqual({
    type: "terms",
    value: [
      {
        termValue: "value",
        termName: "name",
      },
    ],
  });

  const [summary] = await metricsStore.insertMany([
    {
      organizationId,
      projectId,
      fileReferenceId,
      processedFileId,
      textChunkGroupId,
      textChunkId,
      value: {
        type: "summary",
        value: ["hi there"],
      },
    },
  ]);

  expect(summary.value).toEqual({
    type: "summary",
    value: ["hi there"],
  });
});

test("getFile", async () => {
  const {
    organizationId,
    projectId,
    fileReferenceId,
    processedFileId,
    textChunkGroupId,
    textChunkId,
    metricsStore,
  } = await setup();

  await metricsStore.insertMany([
    {
      organizationId,
      projectId,
      fileReferenceId,
      processedFileId,
      textChunkGroupId,
      textChunkId,
      value: {
        type: "financial_summary",
        value: {
          investmentRisks: ["foo"],
          investmentMerits: ["bar"],
          financialSummaries: ["baz"],
        },
      },
    },
    {
      organizationId,
      projectId,
      fileReferenceId,
      processedFileId,
      textChunkGroupId,
      textChunkId,
      value: {
        type: "terms",
        value: [
          {
            termValue: "value",
            termName: "name",
          },
        ],
      },
    },
    {
      organizationId,
      projectId,
      fileReferenceId,
      processedFileId,
      textChunkGroupId,
      textChunkId,
      value: {
        type: "summary",
        value: ["hi there"],
      },
    },
  ]);

  const output = await metricsStore.getForFile(fileReferenceId);
  expect(output.length).toEqual(3);
});

import { sql } from "slonik";
import { afterEach, beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PsqlFileReferenceStore } from "../file-reference-store";
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

  return {
    pool,
    user,
    project,
    fileReference,
    processedFile,
    chunkStore,
  };
}

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference, processed_file CASCADE`,
  );
});

afterEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference CASCADE`,
  );
});

test("insertMany", async () => {
  const { processedFile, chunkStore } = await setup();

  const textChunkGroup = await chunkStore.upsertTextChunkGroup({
    organizationId: processedFile.organizationId,
    projectId: processedFile.projectId,
    fileReferenceId: processedFile.fileReferenceId,
    processedFileId: processedFile.id,
    numChunks: 2,
    strategy: "greedy_v0",
    embeddingsWillBeGenerated: true,
  });

  const res = await chunkStore.upsertTextChunk(
    {
      organizationId: processedFile.organizationId,
      projectId: processedFile.projectId,
      fileReferenceId: processedFile.fileReferenceId,
      processedFileId: processedFile.id,
      textChunkGroupId: textChunkGroup.id,
    },
    {
      chunkOrder: 0,
      chunkText: "hi",
      hash: ShaHash.forData("hi"),
    },
  );

  expect(res.id).toBeDefined();
  expect(res.chunkText).toEqual("hi");

  const textChunkGroupAgain = await chunkStore.getTextChunkGroup(
    textChunkGroup.id,
  );

  expect(textChunkGroup.numChunks).toEqual(2);

  await chunkStore.upsertManyTextChunks(
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
    ],
  );

  await chunkStore.getTextChunkGroup(textChunkGroup.id);

  expect(textChunkGroupAgain.numChunks).toEqual(2);

  await chunkStore.upsertManyTextChunks(
    {
      organizationId: processedFile.organizationId,
      projectId: processedFile.projectId,
      fileReferenceId: processedFile.fileReferenceId,
      processedFileId: processedFile.id,
      textChunkGroupId: textChunkGroup.id,
    },
    [
      {
        chunkOrder: 1,
        chunkText: "bye",
        hash: ShaHash.forData("bye"),
      },
    ],
  );
  const textChunkGroupFinal = await chunkStore.getTextChunkGroup(
    textChunkGroup.id,
  );

  expect(textChunkGroupFinal.numChunks).toEqual(2);
});

test("setManyEmbeddings", async () => {
  const { processedFile, chunkStore } = await setup();

  const textChunkGroup = await chunkStore.upsertTextChunkGroup({
    organizationId: processedFile.organizationId,
    projectId: processedFile.projectId,
    fileReferenceId: processedFile.fileReferenceId,
    processedFileId: processedFile.id,
    numChunks: 2,
    strategy: "greedy_v0",
    embeddingsWillBeGenerated: true,
  });

  const [t1, t2] = await chunkStore.upsertManyTextChunks(
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
      {
        chunkOrder: 1,
        chunkText: "hi",
        hash: ShaHash.forData("hi"),
      },
    ],
  );

  expect(t1.hasEmbedding).toEqual(false);
  expect(t2.hasEmbedding).toEqual(false);

  const [t1Prime] = await chunkStore.setManyEmbeddings(textChunkGroup.id, [
    {
      chunkId: t1.id,
      embedding: [1, 2, 3],
    },
  ]);

  expect(t1Prime.hasEmbedding).toEqual(true);

  await chunkStore.getTextChunkGroup(textChunkGroup.id);

  const [t2Prime] = await chunkStore.setManyEmbeddings(textChunkGroup.id, [
    {
      chunkId: t2.id,
      embedding: [1, 2, 3],
    },
  ]);

  expect(t2Prime.hasEmbedding).toEqual(true);
});

test("getEmbedding", async () => {
  const { processedFile, chunkStore } = await setup();

  const textChunkGroup = await chunkStore.upsertTextChunkGroup({
    organizationId: processedFile.organizationId,
    projectId: processedFile.projectId,
    fileReferenceId: processedFile.fileReferenceId,
    processedFileId: processedFile.id,
    numChunks: 1,
    strategy: "greedy_v0",
    embeddingsWillBeGenerated: true,
  });

  const textChunk = await chunkStore.upsertTextChunk(
    {
      organizationId: processedFile.organizationId,
      projectId: processedFile.projectId,
      fileReferenceId: processedFile.fileReferenceId,
      processedFileId: processedFile.id,
      textChunkGroupId: textChunkGroup.id,
    },

    {
      chunkOrder: 0,
      chunkText: "hi",
      hash: ShaHash.forData("hi"),
    },
  );

  await chunkStore.setManyEmbeddings(
    textChunkGroup.id,

    [
      {
        chunkId: textChunk.id,
        embedding: [1, 2, 3],
      },
    ],
  );

  const embedding = await chunkStore.getEmbedding(textChunk.id);

  expect(embedding.embedding).toEqual([1, 2, 3]);
});

test("getTextChunkGroupByStrategy", async () => {
  const { processedFile, chunkStore } = await setup();

  const v0 = await chunkStore.upsertTextChunkGroup({
    organizationId: processedFile.organizationId,
    projectId: processedFile.projectId,
    fileReferenceId: processedFile.fileReferenceId,
    processedFileId: processedFile.id,
    numChunks: 2,
    strategy: "greedy_v0",
    embeddingsWillBeGenerated: false,
  });

  await chunkStore.upsertTextChunkGroup({
    organizationId: processedFile.organizationId,
    projectId: processedFile.projectId,
    fileReferenceId: processedFile.fileReferenceId,
    processedFileId: processedFile.id,
    numChunks: 2,
    strategy: "greedy_15k",
    embeddingsWillBeGenerated: false,
  });

  const v0_2 = await chunkStore.getTextChunkGroupByStrategy(
    processedFile.fileReferenceId,
    "greedy_v0",
  );

  expect(v0).toEqual(v0_2);
});

test("iterateTextChunks", async () => {
  const { processedFile, chunkStore } = await setup();

  const textChunkGroup = await chunkStore.upsertTextChunkGroup({
    organizationId: processedFile.organizationId,
    projectId: processedFile.projectId,
    fileReferenceId: processedFile.fileReferenceId,
    processedFileId: processedFile.id,
    numChunks: 3,
    strategy: "greedy_v0",
    embeddingsWillBeGenerated: false,
  });

  await chunkStore.upsertManyTextChunks(
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
      {
        chunkOrder: 1,
        chunkText: "bye",
        hash: ShaHash.forData("hi"),
      },
      {
        chunkOrder: 2,
        chunkText: "bye",
        hash: ShaHash.forData("hi"),
      },
    ],
  );

  const uniq = new Set<number>();
  let total = 0;
  const iterator = chunkStore.iterateTextChunks(2, textChunkGroup.id);
  for await (const group of iterator) {
    total += 1;
    for (const chunk of group) {
      uniq.add(chunk.chunkOrder);
    }
  }
  expect(total).toEqual(2);
  expect(uniq.size).toEqual(3);
});

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
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference, processed_file CASCADE`
  );
});

afterEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference CASCADE`
  );
});

test("insertMany", async () => {
  const { processedFile, chunkStore } = await setup();

  const [res] = await chunkStore.upsertMany([
    {
      organizationId: processedFile.organizationId,
      projectId: processedFile.projectId,
      fileReferenceId: processedFile.fileReferenceId,
      processedFileId: processedFile.id,
      chunkOrder: 0,
      chunkText: "hi",
      hash: ShaHash.forData("hi"),
    },
  ]);

  expect(res.id).toBeDefined();
  expect(res.chunkText).toEqual("hi");
});

test("listWithNoEmbeddings", async () => {
  const { processedFile, chunkStore } = await setup();

  await chunkStore.upsertMany([
    {
      organizationId: processedFile.organizationId,
      projectId: processedFile.projectId,
      fileReferenceId: processedFile.fileReferenceId,
      processedFileId: processedFile.id,
      chunkOrder: 0,
      chunkText: "hello",
      hash: ShaHash.forData("hello"),
    },
    {
      organizationId: processedFile.organizationId,
      projectId: processedFile.projectId,
      fileReferenceId: processedFile.fileReferenceId,
      processedFileId: processedFile.id,
      chunkOrder: 1,
      chunkText: "world",
      hash: ShaHash.forData("world"),
    },
  ]);

  const results = await chunkStore.listWithNoEmbeddings(processedFile.id);
  expect(results.length).toEqual(2);
  expect(results[1].chunkText).toEqual("world");
});

test("setManyEmbeddings", async () => {
  const { processedFile, chunkStore } = await setup();

  const [res] = await chunkStore.upsertMany([
    {
      organizationId: processedFile.organizationId,
      projectId: processedFile.projectId,
      fileReferenceId: processedFile.fileReferenceId,
      processedFileId: processedFile.id,
      chunkOrder: 0,
      chunkText: "hi",
      hash: ShaHash.forData("hi"),
    },
  ]);

  expect(res.hasEmbedding).toEqual(false);

  const [res2] = await chunkStore.setManyEmbeddings([
    {
      chunkId: res.id,
      embedding: [1, 2, 3],
    },
  ]);

  expect(res2.hasEmbedding).toEqual(true);
});

test("getEmbedding", async () => {
  const { processedFile, chunkStore } = await setup();

  const [res] = await chunkStore.upsertMany([
    {
      organizationId: processedFile.organizationId,
      projectId: processedFile.projectId,
      fileReferenceId: processedFile.fileReferenceId,
      processedFileId: processedFile.id,
      chunkOrder: 0,
      chunkText: "hi",
      hash: ShaHash.forData("hi"),
    },
  ]);

  await chunkStore.setManyEmbeddings([
    {
      chunkId: res.id,
      embedding: [1, 2, 3],
    },
  ]);

  const embedding = await chunkStore.getEmbedding(res.id);

  expect(embedding.embedding).toEqual([1, 2, 3]);
});

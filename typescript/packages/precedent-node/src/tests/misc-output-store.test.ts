import { sql } from "slonik";
import { afterEach, beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PsqlFileReferenceStore } from "../file-reference-store";
import { PsqlMiscOutputStore } from "../llm-outputs/misc-output-store";
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
    fileSize: 100,
    sha256: ShaHash.forData("hi"),
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

  const [chunk, chunkTwo] = await chunkStore.upsertManyTextChunks(
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

  const miscOutputStore = new PsqlMiscOutputStore(pool);

  return {
    pool,
    organizationId: user.organizationId,
    userId: user.id,
    projectId: project.id,
    fileReferenceId: fileReference.id,
    processedFileId: processedFile.id,
    textChunkGroupId: textChunkGroup.id,
    textChunkId: chunk.id,
    textChunkId2: chunkTwo.id,
    miscOutputStore,
  };
}

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);
  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference, processed_file, text_chunk_group, text_chunk, misc_output CASCADE`,
  );
});

afterEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);
  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference, processed_file, text_chunk_group, text_chunk, misc_output CASCADE`,
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
    miscOutputStore,
  } = await setup();

  const [terms] = await miscOutputStore.insertMany([
    {
      organizationId,
      projectId,
      fileReferenceId,
      processedFileId,
      textChunkGroupId,
      textChunkId,
      value: {
        type: "terms",
        order: 0,
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
    order: 0,
    value: [
      {
        termValue: "value",
        termName: "name",
      },
    ],
  });
});

test("getForFile", async () => {
  const {
    organizationId,
    projectId,
    fileReferenceId,
    processedFileId,
    textChunkGroupId,
    textChunkId,
    miscOutputStore,
  } = await setup();

  await miscOutputStore.insertMany([
    {
      organizationId,
      projectId,
      fileReferenceId,
      processedFileId,
      textChunkGroupId,
      textChunkId,
      value: {
        type: "terms",
        order: 0,
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
        type: "output",
        slug: "kpi",
        raw: "hi",
        html: "<p>hi</p>",
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
        type: "long_form",
        raw: "hi",
        html: "<p>hi</p>",
      },
    },
  ]);

  const output = await miscOutputStore.getForFile(fileReferenceId);
  expect(output.length).toEqual(3);
});

test("textChunkIdsPresent", async () => {
  const {
    organizationId,
    projectId,
    fileReferenceId,
    processedFileId,
    textChunkGroupId,
    textChunkId,
    textChunkId2,
    miscOutputStore,
  } = await setup();

  await miscOutputStore.insertMany([
    {
      organizationId,
      projectId,
      fileReferenceId,
      processedFileId,
      textChunkGroupId,
      textChunkId,
      value: {
        type: "terms",
        order: 0,
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
      textChunkId: textChunkId2,
      value: {
        type: "terms",
        order: 1,
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
      textChunkGroupId: undefined,
      textChunkId: undefined,
      value: {
        type: "terms",
        order: 1,
        value: [
          {
            termValue: "value",
            termName: "name",
          },
        ],
      },
    },
  ]);

  const output = await miscOutputStore.textChunkIdsPresent(fileReferenceId);
  expect(output).toEqual([textChunkId, textChunkId2].sort());
});

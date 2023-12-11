import { sql } from "slonik";
import { beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PsqlFileReferenceStore } from "../file-reference-store";
import { PsqlLoadedFileStore } from "../loaded-file-store";
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
  const loadedFileStore = new PsqlLoadedFileStore(pool);

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
    fileSize: 1,
  });

  const processedFile = await processedFileStore.upsert({
    organizationId: project.organizationId,
    projectId: project.id,
    fileReferenceId: fileReference.id,
    text: "hi",
    hash: ShaHash.forData("hi"),
    gpt4TokenLength: 1000,
    claude100kLength: 1000,
    numPages: 1,
    textWithPages: [
      {
        text: "hi",
        page: 1,
      },
    ],
  });

  const chunkStore = new PsqlTextChunkStore(pool);

  return {
    pool,
    user,
    projectId: project.id,
    fileReference,
    processedFile,
    chunkStore,
    loadedFileStore,
  };
}

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference, processed_file CASCADE`,
  );
});

test("paginate", async () => {
  const { processedFile, chunkStore, loadedFileStore, projectId } =
    await setup();

  const textChunkGroup = await chunkStore.upsertTextChunkGroup({
    organizationId: processedFile.organizationId,
    projectId: processedFile.projectId,
    fileReferenceId: processedFile.fileReferenceId,
    processedFileId: processedFile.id,
    numChunks: 1,
    strategy: "greedy_v0",
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
      location: {
        type: "single",
        page: 0,
      },
    },
  );

  await chunkStore.setManyEmbeddings([
    {
      chunkId: textChunk.id,
      embedding: [1, 2, 3],
    },
  ]);

  const [loadedFile] = await loadedFileStore.paginate({
    projectId,
    cursor: { type: "first" },
  });

  expect(loadedFile).toContain({
    fileName: "test-file-name.pdf",
    fileType: "pdf",
  });
});

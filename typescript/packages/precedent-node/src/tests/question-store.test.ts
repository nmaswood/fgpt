import { sql } from "slonik";
import { afterEach, beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PsqlFileReferenceStore } from "../file-reference-store";
import { PsqlQuestionStore } from "../llm-outputs/question-store";
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

  const textChunkGroup = await chunkStore.upsertTextChunkGroup({
    organizationId: processedFile.organizationId,
    projectId: processedFile.projectId,
    fileReferenceId: processedFile.fileReferenceId,
    processedFileId: processedFile.id,
    numChunks: 2,
    strategy: "greedy_v0",
  });

  const chunk = await chunkStore.upsertTextChunk(
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
        page: 1,
      },
    },
  );

  const questionStore = new PsqlQuestionStore(pool);

  return {
    pool,
    organizationId: user.organizationId,
    userId: user.id,
    projectId: project.id,
    fileReferenceId: fileReference.id,
    processedFileId: processedFile.id,
    textChunkGroupId: textChunkGroup.id,
    textChunkId: chunk.id,
    questionStore,
  };
}

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);
  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference, processed_file, text_chunk_group, text_chunk, text_chunk_question CASCADE`,
  );
});

afterEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);
  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference, processed_file, text_chunk_group, text_chunk, text_chunk_question CASCADE`,
  );
});

test("insertMany", async () => {
  const {
    organizationId,
    projectId,
    fileReferenceId,
    processedFileId,
    questionStore,
  } = await setup();

  const [question] = await questionStore.insertMany([
    {
      organizationId,
      projectId,
      fileReferenceId,
      processedFileId,
      question: "hi",
      hash: "foo",
    },
  ]);

  expect(question).toEqual("hi");
});

test("getForFile", async () => {
  const {
    organizationId,
    projectId,
    fileReferenceId,
    processedFileId,
    questionStore,
  } = await setup();

  const [question] = await questionStore.insertMany([
    {
      organizationId,
      projectId,
      fileReferenceId,
      processedFileId,

      question: "hi",
      hash: "foo",
    },
  ]);

  expect(question).toEqual("hi");
});

test("sampleForFile", async () => {
  const {
    organizationId,
    projectId,
    fileReferenceId,
    processedFileId,
    questionStore,
  } = await setup();

  await questionStore.insertMany([
    {
      organizationId,
      projectId,
      fileReferenceId,
      processedFileId,

      question: "hi",
      hash: "foo",
    },
  ]);

  const [question] = await questionStore.sampleForFile(fileReferenceId, 100);

  expect(question).toEqual("hi");
});

test("sampleForProjectId", async () => {
  const {
    organizationId,
    projectId,
    fileReferenceId,
    processedFileId,

    questionStore,
  } = await setup();

  await questionStore.insertMany([
    {
      organizationId,
      projectId,
      fileReferenceId,
      processedFileId,
      question: "hi",
      hash: "foo",
    },
    {
      organizationId,
      projectId,
      fileReferenceId,
      processedFileId,
      question: "hi",
      hash: "foo",
    },
  ]);

  const questions = await questionStore.sampleForProject(projectId, 10);

  expect(questions.length).toEqual(1);
});

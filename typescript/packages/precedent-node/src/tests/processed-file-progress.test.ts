import { sql } from "slonik";
import { afterEach, beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PsqlFileReferenceStore } from "../file-reference-store";
import { NOOP_MESSAGE_BUS_SERVICE } from "../message-bus-service";
import { PsqlProcessedFileStore } from "../processed-file-store";
import { ProcessedFileProgressServiceImpl } from "../progress/processed-file-progress-store";
import { PSqlProjectStore } from "../project-store";
import { PSqlTaskStore } from "../task-store";
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
    fileSize: 1,
    sha256: "hi",
  });

  await processedFileStore.upsert({
    organizationId: fileReference.organizationId,
    projectId: fileReference.projectId,
    fileReferenceId: fileReference.id,
    text: "hi",
    hash: "hi",
    gpt4TokenLength: 1000,
    claude100kLength: 1000,
    textWithPages: [
      {
        text: "hi",
        page: 1,
      },
    ],
    numPages: 1,
  });
  const taskStore = new PSqlTaskStore(pool, NOOP_MESSAGE_BUS_SERVICE);

  const progressStore = new ProcessedFileProgressServiceImpl(taskStore);

  return {
    organizationId: fileReference.organizationId,
    projectId: fileReference.projectId,
    fileReferenceId: fileReference.id,
    taskStore,
    progressStore,
  };
}

const TRUNCATE = sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference, processed_file, task CASCADE`;

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(TRUNCATE);
});

afterEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(TRUNCATE);
});

test("getProgress#no_tasks", async () => {
  const { fileReferenceId, progressStore } = await setup();

  const progress = await progressStore.getProgress(fileReferenceId);
  expect(progress).toEqual({
    status: "pending",
    forTask: {
      embeddingChunk: "task_does_not_exist",
      report: "task_does_not_exist",
      longFormReport: "task_does_not_exist",
      upsertEmbeddings: "task_does_not_exist",
      extractTable: "task_does_not_exist",
      scan: "task_does_not_exist",
      thumbnail: "task_does_not_exist",
    },
  });
});

test("getProgress#pending", async () => {
  const {
    organizationId,
    projectId,
    fileReferenceId,
    taskStore,
    progressStore,
  } = await setup();

  await taskStore.insertMany([
    {
      organizationId,
      projectId,
      fileReferenceId,
      config: {
        organizationId,
        projectId,
        type: "text-chunk",
        fileReferenceId,
        processedFileId: "1",
        strategy: "greedy_v0",
      },
    },
    {
      organizationId,
      projectId,
      fileReferenceId,
      config: {
        organizationId,
        projectId,
        type: "text-chunk",
        fileReferenceId,
        processedFileId: "1",
        strategy: "greedy_15k",
      },
    },
  ]);
  const progress = await progressStore.getProgress(fileReferenceId);
  expect(progress).toEqual({
    status: "pending",
    forTask: {
      embeddingChunk: "queued",
      report: "task_does_not_exist",
      longFormReport: "task_does_not_exist",
      upsertEmbeddings: "task_does_not_exist",
      extractTable: "task_does_not_exist",
      thumbnail: "task_does_not_exist",

      scan: "task_does_not_exist",
    },
  });
});

test("getProgress#has_failure", async () => {
  const {
    organizationId,
    projectId,
    fileReferenceId,
    taskStore,
    progressStore,
  } = await setup();

  const [task1, task2] = await taskStore.insertMany([
    {
      organizationId,
      projectId,
      fileReferenceId,
      config: {
        organizationId,
        projectId,
        type: "text-chunk",
        fileReferenceId,
        processedFileId: "1",
        strategy: "greedy_v0",
      },
    },
    {
      organizationId,
      projectId,
      fileReferenceId,
      config: {
        organizationId,
        projectId,
        type: "text-chunk",
        fileReferenceId,
        processedFileId: "1",
        strategy: "greedy_15k",
      },
    },
  ]);

  await taskStore.setToFailed(task1.id);
  await taskStore.setToSuceeded(task2.id);
  const progress = await progressStore.getProgress(fileReferenceId);

  expect(progress).toEqual({
    status: "error",
    forTask: {
      embeddingChunk: "failed",
      report: "task_does_not_exist",
      longFormReport: "task_does_not_exist",
      upsertEmbeddings: "task_does_not_exist",
      extractTable: "task_does_not_exist",
      thumbnail: "task_does_not_exist",
      scan: "task_does_not_exist",
    },
  });
});

test("getProgress#complete", async () => {
  const {
    organizationId,
    projectId,
    fileReferenceId,
    taskStore,
    progressStore,
  } = await setup();

  const tasks = await taskStore.insertMany([
    {
      organizationId,
      projectId,
      fileReferenceId,
      config: {
        organizationId,
        projectId,
        type: "text-chunk",
        fileReferenceId,
        processedFileId: "1",
        strategy: "greedy_v0",
      },
    },
    {
      organizationId,
      projectId,
      fileReferenceId,
      config: {
        organizationId,
        projectId,
        type: "text-chunk",
        fileReferenceId,
        processedFileId: "1",
        strategy: "greedy_15k",
      },
    },

    {
      organizationId,
      projectId,
      fileReferenceId,
      config: {
        organizationId,
        projectId,
        type: "text-chunk",
        fileReferenceId,
        processedFileId: "1",
        strategy: "greedy_125k",
      },
    },
    {
      organizationId,
      projectId,
      fileReferenceId,
      config: {
        organizationId,
        projectId,
        type: "gen-embeddings",
        fileReferenceId,
        processedFileId: "1",
        textChunkGroupId: "1",
      },
    },

    {
      organizationId,
      projectId,
      fileReferenceId,
      config: {
        organizationId,
        projectId,
        type: "llm-outputs",
        fileReferenceId,
        processedFileId: "1",
        textChunkGroupId: "1",
        textChunkIds: ["1", "2"],
      },
    },
    {
      organizationId,
      projectId,
      fileReferenceId,
      config: {
        organizationId,
        projectId,
        type: "extract-table",
        fileReferenceId,
      },
    },
    {
      organizationId,
      projectId,
      fileReferenceId,
      config: {
        type: "thumbnail",
        fileReferenceId,
      },
    },
    {
      organizationId,
      projectId,
      fileReferenceId,
      config: {
        type: "scan",
        fileReferenceId,
        processedFileId: "1",
      },
    },
    {
      organizationId,
      projectId,
      fileReferenceId,
      config: {
        organizationId: "1",
        projectId: "1",
        type: "long-form",
        fileReferenceId,
        processedFileId: "1",
        textChunkGroupId: "1",
        textChunkIds: ["1", "2"],
      },
    },
  ]);

  await Promise.all(tasks.map((t) => taskStore.setToSuceeded(t.id)));

  const progress = await progressStore.getProgress(fileReferenceId);

  expect(progress.status).toEqual("ready");
});

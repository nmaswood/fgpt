import { DEFAULT_STATUS } from "@fgpt/precedent-iso";
import { sql } from "slonik";
import { afterEach, beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PsqlFileReferenceStore } from "../file-reference-store";
import { NOOP_MESSAGE_BUS_SERVICE } from "../message-bus-service";
import { PSqlProcessedFileProgressStore } from "../processed-file-progress-store";
import { PsqlProcessedFileStore } from "../processed-file-store";
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
  });

  await processedFileStore.upsert({
    organizationId: fileReference.organizationId,
    projectId: fileReference.projectId,
    fileReferenceId: fileReference.id,
    text: "hi",
    hash: "hi",
    gpt4TokenLength: 1000,
  });
  const taskStore = new PSqlTaskStore(pool, NOOP_MESSAGE_BUS_SERVICE);

  const progressStore = new PSqlProcessedFileProgressStore(taskStore);

  return {
    organizationId: fileReference.organizationId,
    projectId: fileReference.projectId,
    fileReferenceId: fileReference.id,
    taskStore,
    progressStore,
  };
}

const TRUNCATE = sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference, processed_file, task, task_group CASCADE`;

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
    type: "pending",
    forTask: {
      embeddingChunk: DEFAULT_STATUS,
      reportChunk: DEFAULT_STATUS,
      report: DEFAULT_STATUS,
      upsertEmbeddings: DEFAULT_STATUS,
      extractTable: DEFAULT_STATUS,
      analyzeTable: DEFAULT_STATUS,
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

  const [task1, task2] = await taskStore.insertMany([
    {
      organizationId,
      projectId,
      fileReferenceId,
      config: {
        version: "1",
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
        version: "1",
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
    type: "pending",
    forTask: {
      embeddingChunk: { type: "queued" },
      reportChunk: { type: "queued" },
      report: DEFAULT_STATUS,
      upsertEmbeddings: DEFAULT_STATUS,
      extractTable: DEFAULT_STATUS,
      analyzeTable: DEFAULT_STATUS,
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
        version: "1",
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
        version: "1",
        organizationId,
        projectId,
        type: "text-chunk",
        fileReferenceId,
        processedFileId: "1",
        strategy: "greedy_15k",
      },
    },
  ]);

  const t = await taskStore.setToFailed(task1.id);
  const t2 = await taskStore.setToSuceeded(task2.id);
  const progress = await progressStore.getProgress(fileReferenceId);

  expect(progress).toEqual({
    type: "has-failure",
    forTask: {
      embeddingChunk: {
        type: "failed",
      },
      reportChunk: {
        type: "succeeded",
      },
      report: DEFAULT_STATUS,
      upsertEmbeddings: DEFAULT_STATUS,
      extractTable: DEFAULT_STATUS,
      analyzeTable: DEFAULT_STATUS,
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
        version: "1",
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
        version: "1",
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
        version: "1",
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
        version: "1",
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
        version: "1",
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
        version: "1",
        organizationId,
        projectId,
        type: "analyze-table",
        fileReferenceId,
        source: null,
      },
    },
  ]);

  await Promise.all(tasks.map((t) => taskStore.setToSuceeded(t.id)));

  const progress = await progressStore.getProgress(fileReferenceId);

  expect(progress.type).toEqual("succeeded");
});

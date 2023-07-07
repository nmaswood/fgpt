import { DEFAULT_STATUS } from "@fgpt/precedent-iso";
import { sql } from "slonik";
import { afterEach, beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PSqlExcelProgressStore } from "../excel-asset-progress-store";
import { PsqlFileReferenceStore } from "../file-reference-store";
import { NOOP_MESSAGE_BUS_SERVICE } from "../message-bus-service";
import { PSqlProjectStore } from "../project-store";
import { PSqlTaskStore } from "../task-store";
import { PsqlUserOrgService } from "../user-org/user-org-service";
import { TEST_SETTINGS } from "./test-settings";

async function setup() {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  const userOrgService = new PsqlUserOrgService(pool);
  const projectService = new PSqlProjectStore(pool);
  const fileReferenceStore = new PsqlFileReferenceStore(pool);

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
    fileName: "test-file-name.xlsx",
    organizationId: project.organizationId,
    projectId: project.id,
    bucketName: "test-bucket",
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    path: "my-path/foo",
  });

  const taskStore = new PSqlTaskStore(pool, NOOP_MESSAGE_BUS_SERVICE);

  const progressStore = new PSqlExcelProgressStore(taskStore);

  return {
    organizationId: fileReference.organizationId,
    projectId: fileReference.projectId,
    fileReferenceId: fileReference.id,
    progressStore,
    taskStore,
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

test("getProgress#noop", async () => {
  const { fileReferenceId, progressStore } = await setup();
  const progress = await progressStore.getProgress(fileReferenceId);
  expect(progress).toEqual({
    type: "pending",
    forTask: {
      analyzeTable: DEFAULT_STATUS,
    },
  });
});

test("getProgress#success", async () => {
  const {
    organizationId,
    projectId,
    fileReferenceId,
    taskStore,
    progressStore,
  } = await setup();

  const task = await taskStore.insert({
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
  });

  await taskStore.setToSuceeded(task.id);

  const progress = await progressStore.getProgress(fileReferenceId);
  expect(progress).toEqual({
    type: "succeeded",
    forTask: {
      analyzeTable: { type: "succeeded" },
    },
  });
});

test("getProgress#fail", async () => {
  const {
    organizationId,
    projectId,
    fileReferenceId,
    taskStore,
    progressStore,
  } = await setup();

  const task = await taskStore.insert({
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
  });

  await taskStore.setToFailed(task.id);

  const progress = await progressStore.getProgress(fileReferenceId);
  expect(progress).toEqual({
    type: "has-failure",
    forTask: {
      analyzeTable: { type: "failed" },
    },
  });
});

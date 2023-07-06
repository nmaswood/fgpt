import { sql } from "slonik";
import { beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { NOOP_MESSAGE_BUS_SERVICE } from "../message-bus-service";
import { PSqlProjectStore } from "../project-store";
import { PSqlTaskStore } from "../task-store";
import { PsqlUserOrgService } from "../user-org/user-org-service";
import { TEST_SETTINGS } from "./test-settings";
import { PsqlFileReferenceStore } from "../file-reference-store";

async function setup() {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  const userOrgService = new PsqlUserOrgService(pool);
  const projectService = new PSqlProjectStore(pool);
  const taskStore = new PSqlTaskStore(pool, NOOP_MESSAGE_BUS_SERVICE);

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

  const fileReferenceStore = new PsqlFileReferenceStore(pool);

  const [f1, f2] = await fileReferenceStore.insertMany([
    {
      projectId: project.id,
      organizationId: user.organizationId,
      fileName: "foo",
      contentType: "by",
      bucketName: "bye",
      path: "hi",
      sha256: "hi",
      fileSize: 1,
    },
    {
      projectId: project.id,
      organizationId: user.organizationId,
      fileName: "foo",
      contentType: "by",
      bucketName: "bye",
      path: "hi",
      sha256: "hi",
      fileSize: 1,
    },
  ]);
  return {
    user,
    project,
    pool,
    taskStore,
    fileReferenceId1: f1.id,
    fileReferenceId2: f2.id,
  };
}

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);
  await pool.query(
    sql.unsafe`TRUNCATE TABLE organization, app_user, project, task, file_reference  CASCADE`,
  );
});

test("insertMany", async () => {
  const { user, project, taskStore } = await setup();
  expect(await taskStore.insertMany([])).toEqual([]);
  const [task] = await taskStore.insertMany([
    {
      organizationId: user.organizationId,
      projectId: project.id,
      fileReferenceId: undefined,
      config: {
        version: "1",
        organizationId: user.organizationId,
        projectId: project.id,
        type: "text-extraction",
        fileReferenceId: "123",
      },
    },
  ]);

  expect(task.projectId).toEqual(project.id);
  expect(task.config.type).toEqual("text-extraction");
});

test("insert", async () => {
  const { user, project, taskStore } = await setup();
  const task = await taskStore.insert({
    organizationId: user.organizationId,
    projectId: project.id,
    fileReferenceId: undefined,
    config: {
      version: "1",
      organizationId: user.organizationId,
      projectId: project.id,
      type: "text-extraction",
      fileReferenceId: "123",
    },
  });

  expect(task.projectId).toEqual(project.id);
  expect(task.config.type).toEqual("text-extraction");
});

test("get", async () => {
  const { user, project, taskStore } = await setup();
  const { id } = await taskStore.insert({
    organizationId: user.organizationId,
    projectId: project.id,
    fileReferenceId: undefined,
    config: {
      version: "1",
      organizationId: user.organizationId,
      projectId: project.id,
      type: "text-extraction",
      fileReferenceId: "123",
    },
  });

  const task = await taskStore.get(id);

  expect(task.projectId).toEqual(project.id);
  expect(task.config.type).toEqual("text-extraction");
});

test("getAndSetToInProgress", async () => {
  const { user, project, taskStore } = await setup();
  expect(await taskStore.insertMany([])).toEqual([]);
  await taskStore.insertMany([
    {
      organizationId: user.organizationId,
      projectId: project.id,
      fileReferenceId: undefined,
      config: {
        version: "1",
        organizationId: user.organizationId,
        projectId: project.id,
        type: "text-extraction",
        fileReferenceId: "123",
      },
    },
    {
      organizationId: user.organizationId,
      projectId: project.id,
      fileReferenceId: undefined,
      config: {
        version: "1",
        organizationId: user.organizationId,
        projectId: project.id,
        type: "text-extraction",
        fileReferenceId: "123",
      },
    },
  ]);

  const task = await taskStore.getAndSetToInProgress();
  expect(task?.status).toEqual("in-progress");
});

test("setToSuceeded", async () => {
  const { user, project, taskStore } = await setup();
  expect(await taskStore.insertMany([])).toEqual([]);
  const task = await taskStore.insert({
    organizationId: user.organizationId,
    projectId: project.id,

    fileReferenceId: undefined,
    config: {
      version: "1",
      organizationId: user.organizationId,
      projectId: project.id,
      type: "text-extraction",
      fileReferenceId: "123",
    },
  });

  const completedTask = await taskStore.setToSuceeded(task.id);
  expect(completedTask?.status).toEqual("succeeded");
});

test("setToInProgress", async () => {
  const { user, project, taskStore } = await setup();
  expect(await taskStore.insertMany([])).toEqual([]);
  const task = await taskStore.insert({
    organizationId: user.organizationId,
    projectId: project.id,

    fileReferenceId: undefined,
    config: {
      version: "1",
      organizationId: user.organizationId,
      projectId: project.id,
      type: "text-extraction",
      fileReferenceId: "123",
    },
  });

  const completedTask = await taskStore.setToSuceeded(task.id);
  expect(completedTask?.status).toEqual("succeeded");
  const inProgress = await taskStore.setToInProgress(task.id);
  expect(inProgress?.status).toEqual("in-progress");
});

test("setToFailed", async () => {
  const { user, project, taskStore } = await setup();
  expect(await taskStore.insertMany([])).toEqual([]);
  const task = await taskStore.insert({
    organizationId: user.organizationId,
    projectId: project.id,

    fileReferenceId: undefined,
    config: {
      version: "1",
      organizationId: user.organizationId,
      projectId: project.id,
      type: "text-extraction",
      fileReferenceId: "123",
    },
  });

  const completedTask = await taskStore.setToSuceeded(task.id);
  expect(completedTask?.status).toEqual("succeeded");
});

test("setToQueued", async () => {
  const { user, project, taskStore } = await setup();
  expect(await taskStore.insertMany([])).toEqual([]);
  const task = await taskStore.insert({
    organizationId: user.organizationId,
    projectId: project.id,

    fileReferenceId: undefined,
    config: {
      version: "1",
      organizationId: user.organizationId,
      projectId: project.id,
      type: "text-extraction",
      fileReferenceId: "123",
    },
  });

  const queuedTask = await taskStore.setToQueued(task.id);
  expect(queuedTask?.status).toEqual("queued");
});

test("getByFileReferenceId", async () => {
  const { user, project, taskStore, fileReferenceId1, fileReferenceId2 } =
    await setup();
  expect(await taskStore.insertMany([])).toEqual([]);
  const [task1] = await taskStore.insertMany([
    {
      organizationId: user.organizationId,
      projectId: project.id,
      fileReferenceId: fileReferenceId1,
      config: {
        version: "1",
        organizationId: user.organizationId,
        projectId: project.id,
        type: "text-extraction",
        fileReferenceId: fileReferenceId1,
      },
    },
    {
      organizationId: user.organizationId,
      projectId: project.id,
      fileReferenceId: fileReferenceId2,
      config: {
        version: "1",
        organizationId: user.organizationId,
        projectId: project.id,
        type: "text-extraction",
        fileReferenceId: fileReferenceId2,
      },
    },
  ]);
  const res = await taskStore.getByFileReferenceId(fileReferenceId1);
  expect(res).toEqual([task1]);
});

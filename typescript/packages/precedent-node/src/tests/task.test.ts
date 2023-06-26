import { sql } from "slonik";
import { beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { NOOP_MESSAGE_BUS_SERVICE } from "../message-bus-service";
import { PSqlProjectStore } from "../project-store";
import { PSqlTaskStore } from "../task-store";
import { PsqlUserOrgService } from "../user-org/user-org-service";
import { TEST_SETTINGS } from "./test-settings";

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
  return {
    user,
    project,
    pool,
    taskService: taskStore,
  };
}

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE organization, app_user, project, task CASCADE`
  );
});

test("insertMany", async () => {
  const { user, project, taskService } = await setup();
  expect(await taskService.insertMany([])).toEqual([]);
  const [task] = await taskService.insertMany([
    {
      organizationId: user.organizationId,
      projectId: project.id,
      fileReferenceId: undefined,
      config: {
        version: "1",
        organizationId: user.organizationId,
        projectId: project.id,
        type: "text-extraction",
        fileId: "123",
      },
    },
  ]);

  expect(task.projectId).toEqual(project.id);
  expect(task.config.type).toEqual("text-extraction");
});

test("insert", async () => {
  const { user, project, taskService } = await setup();
  const task = await taskService.insert({
    organizationId: user.organizationId,
    projectId: project.id,
    fileReferenceId: undefined,
    config: {
      version: "1",
      organizationId: user.organizationId,
      projectId: project.id,
      type: "text-extraction",
      fileId: "123",
    },
  });

  expect(task.projectId).toEqual(project.id);
  expect(task.config.type).toEqual("text-extraction");
});

test("get", async () => {
  const { user, project, taskService } = await setup();
  const { id } = await taskService.insert({
    organizationId: user.organizationId,
    projectId: project.id,
    fileReferenceId: undefined,
    config: {
      version: "1",
      organizationId: user.organizationId,
      projectId: project.id,
      type: "text-extraction",
      fileId: "123",
    },
  });

  const task = await taskService.get(id);

  expect(task.projectId).toEqual(project.id);
  expect(task.config.type).toEqual("text-extraction");
});

test("getAndSetToInProgress", async () => {
  const { user, project, taskService } = await setup();
  expect(await taskService.insertMany([])).toEqual([]);
  await taskService.insertMany([
    {
      organizationId: user.organizationId,
      projectId: project.id,
      fileReferenceId: undefined,
      config: {
        version: "1",
        organizationId: user.organizationId,
        projectId: project.id,
        type: "text-extraction",
        fileId: "123",
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
        fileId: "123",
      },
    },
  ]);

  const task = await taskService.getAndSetToInProgress();
  expect(task?.status).toEqual("in-progress");
});

test("setToSuceeded", async () => {
  const { user, project, taskService } = await setup();
  expect(await taskService.insertMany([])).toEqual([]);
  const task = await taskService.insert({
    organizationId: user.organizationId,
    projectId: project.id,

    fileReferenceId: undefined,
    config: {
      version: "1",
      organizationId: user.organizationId,
      projectId: project.id,
      type: "text-extraction",
      fileId: "123",
    },
  });

  const completedTask = await taskService.setToSuceeded(task.id);
  expect(completedTask?.status).toEqual("succeeded");
});

test("setToInProgress", async () => {
  const { user, project, taskService } = await setup();
  expect(await taskService.insertMany([])).toEqual([]);
  const task = await taskService.insert({
    organizationId: user.organizationId,
    projectId: project.id,

    fileReferenceId: undefined,
    config: {
      version: "1",
      organizationId: user.organizationId,
      projectId: project.id,
      type: "text-extraction",
      fileId: "123",
    },
  });

  const completedTask = await taskService.setToSuceeded(task.id);
  expect(completedTask?.status).toEqual("succeeded");
  const inProgress = await taskService.setToInProgress(task.id);
  expect(inProgress?.status).toEqual("in-progress");
});

test("setToFailed", async () => {
  const { user, project, taskService } = await setup();
  expect(await taskService.insertMany([])).toEqual([]);
  const task = await taskService.insert({
    organizationId: user.organizationId,
    projectId: project.id,

    fileReferenceId: undefined,
    config: {
      version: "1",
      organizationId: user.organizationId,
      projectId: project.id,
      type: "text-extraction",
      fileId: "123",
    },
  });

  const completedTask = await taskService.setToSuceeded(task.id);
  expect(completedTask?.status).toEqual("succeeded");
});

test("setToQueued", async () => {
  const { user, project, taskService } = await setup();
  expect(await taskService.insertMany([])).toEqual([]);
  const task = await taskService.insert({
    organizationId: user.organizationId,
    projectId: project.id,

    fileReferenceId: undefined,
    config: {
      version: "1",
      organizationId: user.organizationId,
      projectId: project.id,
      type: "text-extraction",
      fileId: "123",
    },
  });

  const queuedTask = await taskService.setToQueued(task.id);
  expect(queuedTask?.status).toEqual("queued");
});

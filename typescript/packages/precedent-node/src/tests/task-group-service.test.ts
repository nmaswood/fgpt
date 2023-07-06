import { sql } from "slonik";
import { beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PsqlFileReferenceStore } from "../file-reference-store";
import { NOOP_MESSAGE_BUS_SERVICE } from "../message-bus-service";
import { PSqlProjectStore } from "../project-store";
import { PsqlTaskGroupService } from "../task-group-service";
import { PSqlTaskStore } from "../task-store";
import { PsqlUserOrgService } from "../user-org/user-org-service";
import { TEST_SETTINGS } from "./test-settings";

async function setup() {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  const userOrgService = new PsqlUserOrgService(pool);
  const projectService = new PSqlProjectStore(pool);
  const taskStore = new PSqlTaskStore(pool, NOOP_MESSAGE_BUS_SERVICE);
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
    fileName: "hi",
    organizationId: user.organizationId,
    projectId: project.id,
    bucketName: "test",
    path: "test",
    contentType: "text/plain",
  });

  const taskGroupService = new PsqlTaskGroupService(pool);
  return {
    organizationId: user.organizationId,
    userId: user.id,
    projectId: project.id,
    taskStore,
    taskGroupService,
    fileReferenceId: fileReference.id,
  };
}

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE organization, app_user, project, task, task_group CASCADE`
  );
});

test("insertTaskGroup", async () => {
  const {
    organizationId,
    projectId,
    taskStore,
    taskGroupService,
    fileReferenceId,
  } = await setup();
  expect(await taskStore.insertMany([])).toEqual([]);
  await taskStore.insert({
    organizationId,
    projectId,
    fileReferenceId,
    config: {
      version: "1",
      organizationId,
      projectId,
      type: "text-extraction",
      fileReferenceId: "123",
    },
  });

  const taskGroup = await taskGroupService.insertTaskGroup({
    organizationId,
    projectId,
    fileReferenceId,
    description: "I love cats",
  });

  expect(taskGroup.id).toBeDefined();
  expect(taskGroup.description).toEqual("I love cats");
  expect(taskGroup.numCompletedTasks).toEqual(0);
  expect(taskGroup.numFailedTasks).toEqual(0);
  expect(taskGroup.numPendingTasks).toEqual(0);
});

test("upsertTask", async () => {
  const {
    organizationId,
    projectId,
    taskStore,
    taskGroupService,
    fileReferenceId,
  } = await setup();
  expect(await taskStore.insertMany([])).toEqual([]);
  const taskGroup = await taskGroupService.insertTaskGroup({
    organizationId,
    projectId,
    fileReferenceId,
    description: "I love cats",
  });

  expect(taskGroup.id).toBeDefined();
  expect(taskGroup.description).toEqual("I love cats");
  expect(taskGroup.numCompletedTasks).toEqual(0);
  expect(taskGroup.numFailedTasks).toEqual(0);
  expect(taskGroup.numPendingTasks).toEqual(0);

  const [taskA, taskB, taskC, taskD] = await taskStore.insertMany([
    {
      organizationId,
      projectId,
      fileReferenceId,
      config: {
        version: "1",
        organizationId,
        projectId,
        type: "text-extraction",
        fileReferenceId: "123",
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
        type: "text-extraction",
        fileReferenceId: "123",
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
        type: "text-extraction",
        fileReferenceId: "123",
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
        type: "text-extraction",
        fileReferenceId: "123",
      },
    },
  ]);

  const first = await taskGroupService.upsertTask(taskGroup.id, taskA.id);

  await taskGroupService.upsertTask(taskGroup.id, taskA.id);
  await taskGroupService.upsertTask(taskGroup.id, taskA.id);
  await taskGroupService.upsertTask(taskGroup.id, taskA.id);
  await taskGroupService.upsertTask(taskGroup.id, taskA.id);
  await taskGroupService.upsertTask(taskGroup.id, taskA.id);

  expect(first.numTotalTasks).toEqual(1);
  expect(first.numPendingTasks).toEqual(1);
  expect(first.numFailedTasks).toEqual(0);
  const second = await taskGroupService.upsertTask(taskGroup.id, taskB.id);

  expect(second.numTotalTasks).toEqual(2);
  expect(second.numPendingTasks).toEqual(2);
  expect(second.numFailedTasks).toEqual(0);

  await taskStore.setToFailed(taskC.id);
  //taskStore.setToSuceeded();
  //taskStore.setToQueued();
  const third = await taskGroupService.upsertTask(taskGroup.id, taskC.id);

  expect(third.numTotalTasks).toEqual(3);
  expect(third.numPendingTasks).toEqual(2);
  expect(third.numFailedTasks).toEqual(1);

  await taskStore.setToFailed(taskA.id);

  const fourth = await taskGroupService.upsertTask(taskGroup.id, taskA.id);
  expect(fourth.numTotalTasks).toEqual(3);
  expect(fourth.numCompletedTasks).toEqual(0);
  expect(fourth.numPendingTasks).toEqual(1);
  expect(fourth.numFailedTasks).toEqual(2);

  await taskStore.setToSuceeded(taskD.id);

  const fifth = await taskGroupService.upsertTask(taskGroup.id, taskD.id);

  expect(fifth.numTotalTasks).toEqual(4);
  expect(fifth.numCompletedTasks).toEqual(1);
  expect(fifth.numPendingTasks).toEqual(1);
  expect(fifth.numFailedTasks).toEqual(2);
});

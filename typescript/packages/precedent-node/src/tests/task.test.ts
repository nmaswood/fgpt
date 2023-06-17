import { sql } from "slonik";
import { beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PSqlProjectStore } from "../project-store";
import { PSqlTaskStore } from "../task-store";
import { PsqlUserOrgService } from "../user-org/user-org-service";
import { TEST_SETTINGS } from "./test-settings";

async function setup() {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  const userOrgService = new PsqlUserOrgService(pool);
  const projectService = new PSqlProjectStore(pool);
  const taskService = new PSqlTaskStore(pool);

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
    taskService,
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

test("setAsPending", async () => {
  const { user, project, taskService } = await setup();
  expect(await taskService.insertMany([])).toEqual([]);
  await taskService.insertMany([
    {
      organizationId: user.organizationId,
      projectId: project.id,
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
      config: {
        version: "1",
        organizationId: user.organizationId,
        projectId: project.id,
        type: "text-extraction",
        fileId: "123",
      },
    },
  ]);

  const [task] = await taskService.setAsPending({ limit: 1 });
  expect(task.status).toEqual("in-progress");
});

test("setAsPending", async () => {
  const { user, project, taskService } = await setup();
  expect(await taskService.insertMany([])).toEqual([]);
  const [task] = await taskService.insertMany([
    {
      organizationId: user.organizationId,
      projectId: project.id,
      config: {
        version: "1",
        organizationId: user.organizationId,
        projectId: project.id,
        type: "text-extraction",
        fileId: "123",
      },
    },
  ]);

  const [completedTask] = await taskService.setAsCompleted([
    {
      taskId: task.id,
      status: "succeeded",
      output: {},
    },
  ]);
  expect(completedTask.status).toEqual("succeeded");
});

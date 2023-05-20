import { sql } from "slonik";
import { beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PSqlProjectStore } from "../project-store";
import { PSqlTaskService } from "../task-service";
import { TEST_SETTINGS } from "../test-settings";
import { PsqlUserOrgService } from "../user-org/user-org-service";

async function setup() {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  const userOrgService = new PsqlUserOrgService(pool);
  const projectService = new PSqlProjectStore(pool);
  const taskService = new PSqlTaskService(pool);

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
  const;
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
});

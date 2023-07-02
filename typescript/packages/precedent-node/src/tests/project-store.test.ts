import { sql } from "slonik";
import { afterEach, beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PSqlProjectStore } from "../project-store";
import { PsqlUserOrgService } from "../user-org/user-org-service";
import { TEST_SETTINGS } from "./test-settings";

async function setup() {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  const userOrgService = new PsqlUserOrgService(pool);
  const projectService = new PSqlProjectStore(pool);

  const user = await userOrgService.upsert({
    sub: {
      provider: "google",
      value: "abc",
    },
    email: "nasr@test.com",
  });

  return {
    pool,
    userId: user.id,
    organizationId: user.organizationId,
    projectService,
  };
}

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project CASCADE`
  );
});

afterEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project CASCADE`
  );
});

test("create", async () => {
  const { projectService, userId, organizationId } = await setup();

  const project = await projectService.create({
    name: "test",
    organizationId,
    creatorUserId: userId,
  });
  expect(project.name).toEqual("test");
});

test("delete", async () => {
  const { projectService, userId, organizationId } = await setup();

  const project = await projectService.create({
    name: "test",
    organizationId,
    creatorUserId: userId,
  });

  const res = await projectService.delete(project.id);
  expect(res).toEqual(true);
  const projects = await projectService.list(organizationId);
  expect(projects.length).toEqual(0);
});

test("update", async () => {
  const { projectService, userId, organizationId } = await setup();

  const project = await projectService.create({
    name: "test",
    organizationId,
    creatorUserId: userId,
  });

  const updatedProject = await projectService.update({
    id: project.id,
    name: "I love cats",
  });

  expect(updatedProject.name).toEqual("I love cats");
});

test("addToFileCount", async () => {
  const { projectService, userId, organizationId } = await setup();

  const project = await projectService.create({
    name: "test",
    organizationId,
    creatorUserId: userId,
  });

  expect(project.fileCount).toEqual(0);

  const newP = await projectService.addToFileCount(project.id, 10);
  expect(newP.fileCount).toEqual(10);
});

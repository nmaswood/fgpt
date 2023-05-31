import { sql } from "slonik";
import { afterEach, beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PSqlProjectStore } from "../project-store";
import { PsqlReportStore } from "../report-store";
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
  const project = await projectService.create({
    name: "test",
    organizationId: user.organizationId,
    creatorUserId: user.id,
  });

  const reportStore = new PsqlReportStore(pool);

  return {
    pool,
    userId: user.id,
    organizationId: user.organizationId,
    projectId: project.id,
    reportStore,
  };
}

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, report CASCADE`
  );
});

afterEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project CASCADE`
  );
});

test("insert", async () => {
  const { reportStore, projectId, organizationId } = await setup();

  const report = await reportStore.insert({
    organizationId,
    projectId,
    name: "test",
    definition: {
      version: "1",
      items: [],
    },
  });
  expect(report.name).toBe("test");
  expect(report.output).toBeUndefined();
});

test("get", async () => {
  const { reportStore, projectId, organizationId } = await setup();

  const { id } = await reportStore.insert({
    organizationId,
    projectId,
    name: "test",
    definition: {
      version: "1",
      items: [],
    },
  });

  const report = await reportStore.get(id);

  expect(report.name).toBe("test");
});

test("list", async () => {
  const { reportStore, projectId, organizationId } = await setup();

  await reportStore.insert({
    organizationId,
    projectId,
    name: "test",
    definition: {
      version: "1",
      items: [],
    },
  });

  const [report] = await reportStore.list(projectId);

  expect(report.name).toBe("test");
});

test("update", async () => {
  const { reportStore, projectId, organizationId } = await setup();

  const { id } = await reportStore.insert({
    organizationId,
    projectId,
    name: "test",
    definition: {
      version: "1",
      items: [],
    },
  });

  const report = await reportStore.update({
    id,
    name: "test2",
  });

  expect(report.name).toBe("test2");
});

test("delete", async () => {
  const { reportStore, projectId, organizationId } = await setup();

  const { id } = await reportStore.insert({
    organizationId,
    projectId,
    name: "test",
    definition: {
      version: "1",
      items: [],
    },
  });

  await reportStore.delete(id);

  const [report] = await reportStore.list(projectId);
  expect(report).toBeUndefined();
});

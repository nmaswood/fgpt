import { sql } from "slonik";
import { afterEach, beforeEach, expect, test } from "vitest";

import { PsqlAnalysisStore } from "../analysis-store";
import { dataBasePool } from "../data-base-pool";
import { PsqlFileReferenceStore } from "../file-reference-store";
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
  const project = await projectService.create({
    name: "test",
    organizationId: user.organizationId,
    creatorUserId: user.id,
  });
  const fileReferenceStore = new PsqlFileReferenceStore(pool);

  const analysisStore = new PsqlAnalysisStore(pool);
  const file = await fileReferenceStore.insert({
    fileName: "hi",
    organizationId: user.organizationId,
    projectId: project.id,
    bucketName: "test",
    path: "test",
    contentType: "application/pdf",
  });

  return {
    pool,
    userId: user.id,
    organizationId: user.organizationId,
    projectId: project.id,
    fileReferenceId: file.id,
    analysisStore,
  };
}

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, analysis CASCADE`
  );
});

afterEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project CASCADE`
  );
});

test("insert", async () => {
  const { analysisStore, projectId, organizationId, fileReferenceId } =
    await setup();

  const analysis = await analysisStore.insert({
    organizationId,
    projectId,
    name: "test",
    definition: {
      version: "1",
      items: [],
    },
    fileReferenceId,
  });
  expect(analysis.name).toBe("test");
  expect(analysis.output).toBeUndefined();
});

test("get", async () => {
  const {
    analysisStore,
    projectId,
    organizationId,

    fileReferenceId,
  } = await setup();

  const { id } = await analysisStore.insert({
    organizationId,
    projectId,
    name: "test",
    definition: {
      version: "1",
      items: [],
    },
    fileReferenceId,
  });

  const analysis = await analysisStore.get(id);

  expect(analysis.name).toBe("test");
});

test("list", async () => {
  const { analysisStore, projectId, organizationId, fileReferenceId } =
    await setup();

  await analysisStore.insert({
    organizationId,
    projectId,
    name: "test",
    definition: {
      version: "1",
      items: [],
    },
    fileReferenceId,
  });

  const [analysis] = await analysisStore.list(projectId);

  expect(analysis.name).toBe("test");
});

test("update", async () => {
  const { analysisStore, projectId, organizationId, fileReferenceId } =
    await setup();

  const { id } = await analysisStore.insert({
    organizationId,
    projectId,
    name: "test",
    definition: {
      version: "1",
      items: [],
    },
    fileReferenceId,
  });

  const analysis = await analysisStore.update({
    id,
    name: "test2",
  });

  expect(analysis.name).toBe("test2");
});

test("delete", async () => {
  const {
    analysisStore,
    projectId,
    organizationId,

    fileReferenceId,
  } = await setup();

  const { id } = await analysisStore.insert({
    organizationId,
    projectId,
    name: "test",
    definition: {
      version: "1",
      items: [],
    },
    fileReferenceId,
  });

  await analysisStore.delete(id);

  const [analysis] = await analysisStore.list(projectId);
  expect(analysis).toBeUndefined();
});

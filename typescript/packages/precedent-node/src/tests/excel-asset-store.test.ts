import { sql } from "slonik";
import { afterEach, beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PsqlExcelAssetStore } from "../excel-asset-store";
import { PsqlFileReferenceStore } from "../file-reference-store";
import { PSqlProjectStore } from "../project-store";
import { PsqlUserOrgService } from "../user-org/user-org-service";
import { TEST_SETTINGS } from "./test-settings";

async function setup() {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  const userOrgService = new PsqlUserOrgService(pool);
  const projectService = new PSqlProjectStore(pool);
  const fileReferenceStore = new PsqlFileReferenceStore(pool);

  const excelStore = new PsqlExcelAssetStore(pool);

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

  return {
    pool,
    userId: user.id,
    projectId: project.id,
    organizationId: project.organizationId,
    fileReferenceId: fileReference.id,
    excelStore,
  };
}

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference, processed_file CASCADE`,
  );
});

afterEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference CASCADE`,
  );
});

test("insert", async () => {
  const { excelStore, fileReferenceId, organizationId, projectId } =
    await setup();

  const res = await excelStore.insert({
    organizationId,
    projectId,
    fileReferenceId,
    bucketName: "hi",
    path: "hi",
    numSheets: 1,
  });

  expect(res.id).toBeDefined();
});

test("list", async () => {
  const { excelStore, fileReferenceId, organizationId, projectId } =
    await setup();

  await excelStore.insert({
    organizationId,
    projectId,
    fileReferenceId,
    bucketName: "hi",
    path: "hi",
    numSheets: 1,
  });
  const [res] = await excelStore.list(fileReferenceId);

  expect(res.id).toBeDefined();
});

test("get", async () => {
  const { excelStore, fileReferenceId, organizationId, projectId } =
    await setup();

  const { id } = await excelStore.insert({
    organizationId,
    projectId,
    fileReferenceId,
    bucketName: "hi",
    path: "hi",
    numSheets: 1,
  });
  const res = await excelStore.get(id);

  expect(res.id).toEqual(id);
});

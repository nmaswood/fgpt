import { sql } from "slonik";
import { afterEach, beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PsqlExcelAssetStore } from "../excel-asset-store";
import { PsqlExcelOutputStore } from "../excel-output-store";
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
  const excelOutputStore = new PsqlExcelOutputStore(pool);

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

  const excelAsset = await excelStore.insert({
    organizationId: project.organizationId,
    projectId: project.id,
    fileReferenceId: fileReference.id,
    bucketName: "hi",
    path: "hi",
    numSheets: 1,
  });

  return {
    pool,
    userId: user.id,
    projectId: project.id,
    organizationId: project.organizationId,
    fileReferenceId: fileReference.id,
    excelAssetId: excelAsset.id,
    excelOutputStore,
  };
}

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference, processed_file CASCADE`
  );
});

afterEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference CASCADE`
  );
});

test("insertMany", async () => {
  const {
    fileReferenceId,
    organizationId,
    projectId,
    excelAssetId,
    excelOutputStore,
  } = await setup();

  await excelOutputStore.insertMany(
    {
      organizationId,
      projectId,
      fileReferenceId,
      excelAssetId,
    },

    {
      0: { foo: "bar" },
    }
  );
});

test("forFileReference", async () => {
  const {
    fileReferenceId,
    organizationId,
    projectId,
    excelAssetId,
    excelOutputStore,
  } = await setup();

  await excelOutputStore.insertMany(
    {
      organizationId,
      projectId,
      fileReferenceId,
      excelAssetId,
    },

    {
      0: { foo: "bar" },
    }
  );

  const result = await excelOutputStore.forFileReference(fileReferenceId);

  expect(result?.outputs).toEqual({
    0: { foo: "bar" },
  });
});

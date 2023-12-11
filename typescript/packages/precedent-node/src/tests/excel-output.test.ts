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
    fileSize: 100,
    sha256: "abc",
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
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference, processed_file, excel_analysis, excel_asset  CASCADE`,
  );
});

afterEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);
  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference CASCADE`,
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

  const resp = await excelOutputStore.insert({
    organizationId,
    projectId,
    fileReferenceId,
    excelAssetId,
    output: {
      type: "v0_chunks",
      value: [
        {
          content: "hi hi hi",
          sheetNames: ["sheet1"],
          html: "hi",
        },
      ],
      model: "gpt",
    },
  });

  expect(resp.output.value[0].content).toEqual("hi hi hi");
});

test("forDerived", async () => {
  const {
    fileReferenceId,
    organizationId,
    projectId,
    excelAssetId,
    excelOutputStore,
  } = await setup();

  await excelOutputStore.insert({
    organizationId,
    projectId,
    fileReferenceId,
    excelAssetId,
    output: {
      type: "v0_chunks",
      value: [
        {
          content: "hi hi hi",
          sheetNames: ["sheet1"],
          html: "hi",
        },
      ],
      model: "claude",
    },
  });

  const derived = await excelOutputStore.forDerived(fileReferenceId);
  const directUpload = await excelOutputStore.forDirectUpload(fileReferenceId);

  expect(derived.length).toEqual(1);
  expect(directUpload.length).toEqual(0);
});

test("forDirectUpload", async () => {
  const { fileReferenceId, organizationId, projectId, excelOutputStore } =
    await setup();

  await excelOutputStore.insert({
    organizationId,
    projectId,
    fileReferenceId,
    excelAssetId: undefined,
    output: {
      type: "v0_chunks",
      value: [
        {
          content: "hi hi hi",
          sheetNames: ["sheet1"],

          html: "hi",
        },
      ],
      model: "gpt",
    },
  });

  const derived = await excelOutputStore.forDerived(fileReferenceId);
  const directUpload = await excelOutputStore.forDirectUpload(fileReferenceId);

  expect(derived.length).toEqual(0);
  expect(directUpload.length).toEqual(1);
});

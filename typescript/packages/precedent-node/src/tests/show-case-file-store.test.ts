import { sql } from "slonik";
import { afterEach, beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import {
  InsertFileReference,
  PsqlFileReferenceStore,
} from "../file-reference-store";
import { PSqlProjectStore } from "../project-store";
import { PsqlShowCaseFileStore } from "../show-case-file-store";
import { PsqlUserOrgService } from "../user-org/user-org-service";
import { TEST_SETTINGS } from "./test-settings";

async function setup() {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  const userOrgService = new PsqlUserOrgService(pool);
  const projectService = new PSqlProjectStore(pool);

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

  const res = await fileReferenceStore.insert({
    fileName: "test-file-name.pdf",
    organizationId: project.organizationId,
    projectId: project.id,
    bucketName: "test-bucket",
    contentType: "application/pdf",
    path: "my-path/foo",
    fileSize: 100,
  });

  const store = new PsqlShowCaseFileStore(pool);

  return {
    pool,
    projectId: project.id,
    fileReferenceId: res.id,
    store,
  };
}

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference, show_case_file CASCADE`,
  );
});

afterEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference, show_case_file CASCADE`,
  );
});

test("get+set", async () => {
  const { projectId, store, fileReferenceId } = await setup();

  const value = await store.get(projectId);
  expect(value).toBeUndefined();
  const value2 = await store.set(projectId, fileReferenceId);
  expect(value2.fileReferenceId).toEqual(fileReferenceId);
  const value3 = await store.get(projectId);
  expect(value3.fileReferenceId).toEqual(fileReferenceId);
});

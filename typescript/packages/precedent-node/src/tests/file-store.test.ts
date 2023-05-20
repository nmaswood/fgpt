import { sql } from "slonik";
import { afterEach, beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import {
  InsertFileReference,
  PsqlFileReferenceStore,
} from "../file-reference-store";
import { PSqlProjectStore } from "../project-store";
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

  return {
    pool,
    user,
    project,
    fileReferenceStore,
  };
}

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference CASCADE`
  );
});

afterEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference CASCADE`
  );
});

test("raw-chunk-store", async () => {
  const { project, fileReferenceStore } = await setup();

  const refs: InsertFileReference[] = [
    {
      fileName: "test-file-name.pdf",
      projectId: project.id,
      bucketName: "test-bucket",
      contentType: "application/pdf",
      path: "my-path/foo",
    },
  ];
  const [res] = await fileReferenceStore.insertMany(refs);
  expect(res.fileName).toBe("test-file-name.pdf");
  expect(res.projectId).toBe(project.id);
  expect(res.contentType).toBe("application/pdf");
  expect(res.id).toBeDefined();

  const fromList = await fileReferenceStore.list(project.id);
  expect(fromList.length).toBe(1);
  const [fromListRes] = fromList;
  expect(fromListRes.fileName).toBe("test-file-name.pdf");
  expect(fromListRes.projectId).toBe(project.id);
  expect(fromListRes.contentType).toBe("application/pdf");
  expect(fromListRes.id).toBeDefined();
});

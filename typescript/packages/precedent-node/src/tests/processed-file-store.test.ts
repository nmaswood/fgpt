import { sql } from "slonik";
import { afterEach, beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PsqlFileReferenceStore } from "../file-reference-store";
import { PsqlProcessedFileProgressStore } from "../processed-file-progress-store";
import { PsqlProcessedFileStore } from "../processed-file-store";
import { PSqlProjectStore } from "../project-store";
import { PsqlUserOrgService } from "../user-org/user-org-service";
import { TEST_SETTINGS } from "./test-settings";

async function setup() {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  const userOrgService = new PsqlUserOrgService(pool);
  const projectService = new PSqlProjectStore(pool);
  const fileReferenceStore = new PsqlFileReferenceStore(pool);

  const processedFileStore = new PsqlProcessedFileStore(pool);

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

  const processedFile = await processedFileStore.upsert({
    organizationId: fileReference.organizationId,
    projectId: fileReference.projectId,
    fileReferenceId: fileReference.id,
    text: "hi",
    hash: "hi",
    gpt4TokenLength: 1000,
  });

  const processedFileProgressStore = new PsqlProcessedFileProgressStore(pool);

  return {
    pool,
    user,
    project,
    fileReference,
    fileReferenceStore,
    processedFile,
    processedFileProgressStore,
  };
}

const TRUNCATE = sql.unsafe`TRUNCATE TABLE app_user, organization, project, file_reference, processed_file, task, task_group CASCADE`;

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(TRUNCATE);
});

afterEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(TRUNCATE);
});

test("getProgress", async () => {});
test("setChunkingTaskGroupId", async () => {});
test("setUpsertEmbeddingTaskId", async () => {});
test("setExtractTableTaskId", async () => {});
test("setAnalyzeTableTaskId", async () => {});

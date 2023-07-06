import { sql } from "slonik";
import { afterEach, beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PsqlUserOrgService } from "../user-org/user-org-service";
import { TEST_SETTINGS } from "./test-settings";

async function setup() {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  const userOrgService = new PsqlUserOrgService(pool);

  return {
    pool,
    userOrgService,
  };
}

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project CASCADE`,
  );
});

afterEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE app_user, organization, project CASCADE`,
  );
});

test("create", async () => {
  const { userOrgService } = await setup();

  const user = await userOrgService.upsert({
    sub: {
      provider: "google",
      value: "abc",
    },
    email: "nasr@test.com",
  });

  expect(user.email).toEqual("nasr@test.com");
});

test("addToProjectCountForOrg", async () => {
  const { userOrgService } = await setup();

  const user = await userOrgService.upsert({
    sub: {
      provider: "google",
      value: "abc",
    },
    email: "nasr@test.com",
  });

  const count = await userOrgService.addToProjectCountForOrg(
    user.organizationId,
    10,
  );
  expect(count).toEqual(10);

  const countPost = await userOrgService.addToProjectCountForOrg(
    user.organizationId,
    -1,
  );

  expect(countPost).toEqual(9);
});

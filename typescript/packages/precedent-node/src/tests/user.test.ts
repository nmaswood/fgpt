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

const TRUNCATE = sql.fragment`TRUNCATE TABLE app_user, organization, project, app_user_invite CASCADE`;
beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(sql.unsafe`${TRUNCATE}`);
});

afterEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(sql.unsafe`${TRUNCATE}`);
});

test("upsertOrganization", async () => {
  const { userOrgService } = await setup();

  const org = await userOrgService.upsertOrganization({
    name: "Test",
  });
  expect(org.name).toEqual("Test");
});

test("create#inserts a user into the dummy org if they are created w/o an invite", async () => {
  const { userOrgService } = await setup();

  const nonInvitedUser = await userOrgService.upsert({
    sub: {
      provider: "google",
      value: "abc",
    },
    email: "nasr@test.com",
  });

  expect(nonInvitedUser.email).toEqual("nasr@test.com");
  expect(nonInvitedUser.status).toEqual("inactive");
  expect(nonInvitedUser.organizationId).toEqual(
    "00000000-0000-0000-0000-000000000000",
  );
});

test("create#inserts a user into designated org if they are created w an invite", async () => {
  const { userOrgService } = await setup();

  const org = await userOrgService.upsertOrganization({
    name: "hi",
  });

  await userOrgService.createInvite({
    email: "maswood@test.com",
    organizationId: org.id,
  });

  const nonInvitedUser = await userOrgService.upsert({
    sub: {
      provider: "google",
      value: "abc",
    },
    email: "maswood@test.com",
  });

  expect(nonInvitedUser.email).toEqual("maswood@test.com");
  expect(nonInvitedUser.status).toEqual("active");
  expect(nonInvitedUser.organizationId).toEqual(org.id);
});

test("creates an org when a user is invited to no org", async () => {
  const { userOrgService } = await setup();

  await userOrgService.createInvite({
    email: "maswood@test.com",
    organizationId: undefined,
  });

  const invitedUser = await userOrgService.upsert({
    sub: {
      provider: "google",
      value: "abc",
    },
    email: "maswood@test.com",
  });

  expect(invitedUser.email).toEqual("maswood@test.com");
  expect(invitedUser.status).toEqual("active");
  expect(invitedUser.organizationId).not.toEqual(
    "00000000-0000-0000-0000-000000000000",
  );

  const postInvites = await userOrgService.listInvites();
  expect(postInvites.length).toEqual(0);
});

test("list", async () => {
  const { userOrgService } = await setup();

  await userOrgService.upsert({
    sub: {
      provider: "google",
      value: "abc",
    },
    email: "nasr@test.com",
  });

  const [user] = await userOrgService.listUsers();

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

test("invite+list", async () => {
  const { userOrgService } = await setup();

  await userOrgService.createInvite({
    email: "nasr@test.com",
    organizationId: undefined,
  });

  const [user] = await userOrgService.listInvites();

  expect(user.email).toEqual("nasr@test.com");
});

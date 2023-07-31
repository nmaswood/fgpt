import {
  IdentitySub,
  InvitedUser,
  Organization,
  User,
  ZUserRole,
  ZUserStatus,
} from "@fgpt/precedent-iso";
import { DatabasePool, DatabaseTransactionConnection, sql } from "slonik";
import { z } from "zod";

const PLACEHOLDER_ORG_ID = "00000000-0000-0000-0000-000000000000";

export interface UpsertOrganization {
  name: string;
}

export interface UpsertUserArguments {
  sub: IdentitySub;
  email: string;
}

export interface InviteUserArgs {
  email: string;
  organizationId: string | undefined;
}

export type InviteUserResponse = "user_already_active" | "user_invited";

export interface UserOrgService {
  upsertOrganization: (args: UpsertOrganization) => Promise<Organization>;
  get: (id: string) => Promise<User>;
  upsert: (args: UpsertUserArguments) => Promise<User>;
  listUsers: () => Promise<User[]>;
  listOrganizations: () => Promise<Organization[]>;
  addToProjectCountForOrg: (
    organizationId: string,
    delta: number,
  ) => Promise<number>;
  createInvite(args: InviteUserArgs): Promise<InviteUserResponse>;
  listInvites(): Promise<InvitedUser[]>;
}

const ORGANIZATION_FIELDS = sql.fragment`id, name`;
const USER_FIELDS = sql.fragment`app_user.id, organization_id, email, role, status`;
const USER_INVITE_FIELDS = sql.fragment`id, email, organization_id`;

export class PsqlUserOrgService implements UserOrgService {
  constructor(private readonly pool: DatabasePool) {}

  async upsertOrganization({
    name,
  }: UpsertOrganization): Promise<Organization> {
    return this.pool.one(sql.type(ZOrganizationRow)`
INSERT INTO organization (name)
    VALUES (${name})
ON CONFLICT (id)
    DO UPDATE SET
        name = ${name}
    RETURNING
        ${ORGANIZATION_FIELDS}
`);
  }

  async get(id: string): Promise<User> {
    return this.pool.one(sql.type(ZUserRow)`
SELECT
    ${USER_FIELDS}
FROM
    app_user
WHERE
    id = ${id}
`);
  }

  async listUsers(): Promise<User[]> {
    const rows = await this.pool.any(sql.type(ZUserRow)`
SELECT
    ${USER_FIELDS}
FROM
    app_user
LIMIT 101
`);
    if (rows.length === 101) {
      throw new Error("max row limit");
    }
    return Array.from(rows);
  }

  async listOrganizations(): Promise<Organization[]> {
    const rows = await this.pool.any(sql.type(ZOrganizationRow)`
SELECT
    ${ORGANIZATION_FIELDS}
FROM
    organization
LIMIT 101
`);
    if (rows.length === 101) {
      throw new Error("max row limit");
    }
    return Array.from(rows);
  }

  async upsert({ sub, email }: UpsertUserArguments): Promise<User> {
    if (sub.provider !== "google") {
      throw new Error("only google is supported right now");
    }

    return this.pool.transaction(async (trx) =>
      this.#upsert(trx, sub.value, email),
    );
  }

  // TODO
  // this logic is pretty complicated
  // simplify this
  async #upsert(
    trx: DatabaseTransactionConnection,
    googleSub: string,
    email: string,
  ): Promise<User> {
    debugger;
    const user = await trx.maybeOne(sql.type(ZUserRow)`
SELECT
    ${USER_FIELDS}
FROM
    app_user
WHERE
    google_sub = ${googleSub}
`);

    if (user && user.status === "active") {
      return user;
    }

    await trx.query(sql.unsafe`
INSERT INTO organization (name, id)
    VALUES ('Placeholder Org', ${PLACEHOLDER_ORG_ID})
ON CONFLICT (id)
    do nothing
`);

    const invite = await this.#getInvite(trx, email);
    if (!invite) {
      return user
        ? user
        : trx.one(sql.type(ZUserRow)`
INSERT INTO app_user (organization_id, email, google_sub)
    VALUES (${PLACEHOLDER_ORG_ID}, ${email}, ${googleSub})
ON CONFLICT (email)
    DO UPDATE SET
        google_sub = EXCLUDED.google_sub, organization_id = EXCLUDED.organization_id
    RETURNING
        ${USER_FIELDS}
`);
    }

    await this.#deleteInvite(trx, invite.id);

    if (invite.organizationId) {
      return trx.one(sql.type(ZUserRow)`
INSERT INTO app_user (organization_id, email, google_sub, status)
    VALUES (${invite.organizationId}, ${email}, ${googleSub}, 'active')
ON CONFLICT (email)
    DO UPDATE SET
        organization_id = EXCLUDED.organization_id, status = 'active'
    RETURNING
        ${USER_FIELDS}
`);
    }

    if (user) {
      return trx.one(sql.type(ZUserRow)`
UPDATE
    app_user
SET
    status = 'active'
WHERE
    id = ${user.id}
RETURNING
    ${USER_FIELDS}
`);
    }

    const slug = `Organization for ${email}`;
    return trx.one(sql.type(ZUserRow)`
WITH new_org AS (
INSERT INTO organization (name)
        VALUES (${slug})
    RETURNING
        id)
    INSERT INTO app_user (organization_id, email, google_sub, status)
        VALUES ((
                SELECT
                    id
                from
                    new_org),
                ${email},
                ${googleSub},
                'active')
    ON CONFLICT (email)
        DO UPDATE SET
            organization_id = EXCLUDED.organization_id,
            status = 'active'
        RETURNING
            ${USER_FIELDS}
`);
  }

  async #deleteInvite(trx: DatabaseTransactionConnection, id: string) {
    await trx.query(sql.unsafe`DELETE FROM app_user_invite where id = ${id} `);
    return undefined;
  }

  async #getInvite(
    trx: DatabaseTransactionConnection,
    email: string,
  ): Promise<InvitedUser | undefined> {
    const invite = await trx.maybeOne(sql.type(ZInvitedUserRow)`
SELECT
    ${USER_INVITE_FIELDS}
FROM
    app_user_invite
WHERE
    email = ${email}
`);
    return invite ?? undefined;
  }

  async addToProjectCountForOrg(id: string, delta: number): Promise<number> {
    return this.pool.oneFirst(
      sql.type(ZProjectCountRow)`
UPDATE
    organization
SET
    project_count = COALESCE(project_count, 0) + ${delta}
WHERE
    id = ${id}
RETURNING
    project_count
`,
    );
  }

  async createInvite({
    email,
    organizationId,
  }: InviteUserArgs): Promise<InviteUserResponse> {
    return this.pool.transaction(async (trx) => {
      const user = await trx.maybeOne(sql.type(ZUserRow)`
SELECT
    ${USER_FIELDS}
FROM
    app_user
WHERE
    google_sub = ${email}
LIMIT 1
`);

      if (user?.status === "active") {
        return "user_already_active";
      }

      await trx.query(sql.unsafe`
INSERT INTO app_user_invite (email, organization_id)
    VALUES (${email}, ${organizationId ?? null})
ON CONFLICT (email)
    DO UPDATE SET
        organization_id = ${organizationId ?? null}
`);
      return "user_invited";
    });
  }

  async listInvites(): Promise<InvitedUser[]> {
    const rows = await this.pool.any(sql.type(ZInvitedUserRow)`
SELECT
    ${USER_INVITE_FIELDS}
FROM
    app_user_invite
LIMIT 101
`);
    if (rows.length === 101) {
      throw new Error("max row limit");
    }

    return Array.from(rows);
  }
}

const ZProjectCountRow = z.object({ project_count: z.number() });

const ZUserRow = z
  .object({
    id: z.string(),
    organization_id: z.string(),
    email: z.string(),
    role: ZUserRole,
    status: ZUserStatus,
  })
  .transform((row) => ({
    id: row.id,
    email: row.email,
    organizationId: row.organization_id,
    role: row.role,
    status: row.status,
  }));

const ZOrganizationRow = z
  .object({
    id: z.string(),
    name: z.string().nullable(),
  })
  .transform((row) => ({
    id: row.id,
    name: row.name ?? undefined,
  }));

const ZInvitedUserRow = z
  .object({
    id: z.string(),
    email: z.string(),
    organization_id: z.string().nullable(),
  })
  .transform((row) => ({
    id: row.id,
    email: row.email,
    organizationId: row.organization_id ?? undefined,
  }));

import {
  IdentitySub,
  InvitedUser,
  User,
  ZUserRole,
  ZUserStatus,
} from "@fgpt/precedent-iso";
import { DatabasePool, DatabaseTransactionConnection, sql } from "slonik";
import { z } from "zod";

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
  get: (id: string) => Promise<User>;
  upsert: (args: UpsertUserArguments) => Promise<User>;
  list: () => Promise<User[]>;
  addToProjectCountForOrg: (
    organizationId: string,
    delta: number,
  ) => Promise<number>;
  invite(args: InviteUserArgs): Promise<InviteUserResponse>;
  listInvites(): Promise<InvitedUser[]>;
}

const USER_FIELDS = sql.fragment`id, organization_id, email, role, status`;

const USER_INVITE_FIELDS = sql.fragment`id, email, organization_id`;

export class PsqlUserOrgService implements UserOrgService {
  constructor(private readonly pool: DatabasePool) {}

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

  async list(): Promise<User[]> {
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

  async upsert({ sub, email }: UpsertUserArguments): Promise<User> {
    if (sub.provider !== "google") {
      throw new Error("only google is supported right now");
    }

    return this.pool.transaction(async (trx) =>
      this.#upsert(trx, sub.value, email),
    );
  }
  async #upsert(
    trx: DatabaseTransactionConnection,
    googleSub: string,
    email: string,
  ): Promise<User> {
    const user = await trx.maybeOne(sql.type(ZUserRow)`
SELECT
    ${USER_FIELDS}
FROM
    app_user
WHERE
    google_sub = ${googleSub}
LIMIT 1
`);

    if (user) {
      return user;
    }

    const orgSlug = `Organization for ${email}`;
    const organizationId = await trx.oneFirst(sql.type(ZCreateOrgRow)`
INSERT INTO organization (name)
    VALUES (${orgSlug})
RETURNING
    id
`);

    return await trx.one(sql.type(ZUserRow)`
INSERT INTO app_user (organization_id, email, google_sub)
    VALUES (${organizationId}, ${email}, ${googleSub})
RETURNING
    ${USER_FIELDS}
`);
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

  async invite({
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

const ZCreateOrgRow = z.object({
  id: z.string(),
});

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

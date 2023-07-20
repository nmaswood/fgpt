import { IdentitySub, User, ZUserRole } from "@fgpt/precedent-iso";
import { DatabasePool, DatabaseTransactionConnection, sql } from "slonik";
import { z } from "zod";

export interface UpsertUserArguments {
  sub: IdentitySub;
  email: string;
}

export interface UserOrgService {
  get: (id: string) => Promise<User>;
  upsert: (args: UpsertUserArguments) => Promise<User>;
  list: () => Promise<User[]>;
  addToProjectCountForOrg: (
    organizationId: string,
    delta: number,
  ) => Promise<number>;
}

const USER_FIELDS = sql.fragment`id, organization_id, email, role`;

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

    const organizationId = (
      await trx.one(sql.type(ZCreateOrgRow)`
INSERT INTO organization (name)
    VALUES (${null})
RETURNING
    id
`)
    ).id;

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
  })
  .transform((row) => ({
    id: row.id,
    email: row.email,
    organizationId: row.organization_id,
    role: row.role,
  }));

import { IdentitySub, User } from "@fgpt/precedent-iso";
import { DatabasePool, DatabaseTransactionConnection, sql } from "slonik";
import { z } from "zod";

export interface UpsertUserArguments {
  sub: IdentitySub;
  email: string;
}

export interface UserOrgService {
  upsert: (args: UpsertUserArguments) => Promise<User>;
  addToProjectCountForOrg: (
    organizationId: string,
    delta: number
  ) => Promise<number>;
}

const USER_FIELDS = sql.fragment`id, organization_id, email`;

export class PsqlUserOrgService implements UserOrgService {
  constructor(private readonly pool: DatabasePool) {}

  async upsert({ sub, email }: UpsertUserArguments): Promise<User> {
    if (sub.provider !== "google") {
      throw new Error("only google is supported right now");
    }

    return this.pool.connect((cnx) =>
      cnx.transaction((trx) => this.#upsert(trx, sub.value, email))
    );
  }
  async #upsert(
    trx: DatabaseTransactionConnection,
    googleSub: string,
    email: string
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
      return Convert.fromUserRow(user);
    }

    const organizationId = (
      await trx.one(sql.type(ZCreateOrgRow)`
INSERT INTO organization (name)
    VALUES (${null})
RETURNING
    id
`)
    ).id;

    const newUser = await trx.one(sql.type(ZUserRow)`
INSERT INTO app_user (organization_id, email, google_sub)
    VALUES (${organizationId}, ${email}, ${googleSub})
RETURNING
    ${USER_FIELDS}
`);

    return Convert.fromUserRow(newUser);
  }

  async addToProjectCountForOrg(id: string, delta: number): Promise<number> {
    return this.pool.connect(async (cnx) => {
      return cnx.oneFirst(
        sql.type(z.object({ project_count: z.number() }))`
UPDATE
    organization
SET
    project_count = COALESCE(project_count, 0) + ${delta}
WHERE
    id = ${id}
RETURNING
    project_count
`
      );
    });
  }
}

const ZCreateOrgRow = z.object({
  id: z.string(),
});

const ZUserRow = z.object({
  id: z.string(),
  organization_id: z.string(),
  email: z.string(),
});

type UserRow = z.infer<typeof ZUserRow>;

class Convert {
  static fromUserRow({ id, email, organization_id }: UserRow) {
    return {
      id,
      email,
      organizationId: organization_id,
    };
  }
}

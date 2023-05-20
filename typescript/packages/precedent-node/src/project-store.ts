import { Project } from "@fgpt/precedent-iso";
import { MAX_PROJECT_LIMIT } from "@fgpt/precedent-iso";
import { DatabasePool, DatabaseTransactionConnection, sql } from "slonik";
import { z } from "zod";

export interface CreateProjectArgs {
  name: string;
  organizationId: string;
  creatorUserId: string;
}

export interface ProjectStore {
  get: (projectId: string) => Promise<Project>;
  getMany: (projectIds: string[]) => Promise<Project[]>;
  list: (organizationId: string) => Promise<Project[]>;
  create: (args: CreateProjectArgs) => Promise<Project>;
}

const PROJECT_FIELDS = sql.fragment`id, organization_id, name`;

export class PSqlProjectStore implements ProjectStore {
  constructor(private readonly pool: DatabasePool) {}
  async list(organizationId: string): Promise<Project[]> {
    return this.pool.connect(async (cnx) => {
      const values = await cnx.query(
        sql.type(ZProjectRow)`
SELECT
    ${PROJECT_FIELDS}
FROM
    project
WHERE
    organization_id = ${organizationId}
`
      );

      return Array.from(values.rows);
    });
  }

  async get(projectId: string): Promise<Project> {
    const [project] = await this.getMany([projectId]);
    if (!project) {
      throw new Error("project not found");
    }
    return project;
  }

  async getMany(projectIds: string[]): Promise<Project[]> {
    return this.pool.connect(async (cnx) => {
      const values = await cnx.query(
        sql.type(ZProjectRow)`
SELECT
    ${PROJECT_FIELDS}
FROM
    project
WHERE
    id IN ${sql.join(projectIds, sql.fragment`, `)}
`
      );

      return Array.from(values.rows);
    });
  }

  async create(args: CreateProjectArgs): Promise<Project> {
    return this.pool.connect((cnx) =>
      cnx.transaction((trx) => this.#create(trx, args))
    );
  }

  async #create(
    trx: DatabaseTransactionConnection,
    { name, organizationId, creatorUserId }: CreateProjectArgs
  ): Promise<Project> {
    const projectLength = await trx.one(
      sql.type(ZCountRow)`
SELECT
    COUNT(*)
FROM
    project
WHERE
    organization_id = ${organizationId}
`
    );

    if (projectLength.count === MAX_PROJECT_LIMIT) {
      throw new Error("too many projects");
    }

    return trx.one(
      sql.type(ZProjectRow)`
INSERT INTO project (name, organization_id, creator_user_id)
    VALUES (${name}, ${organizationId}, ${creatorUserId})
RETURNING
    ${PROJECT_FIELDS}
`
    );
  }
}

const ZCountRow = z.object({
  count: z.number(),
});

const ZProjectRow = z
  .object({
    id: z.string(),
    organization_id: z.string(),
    name: z.string(),
  })
  .transform((v) => ({
    id: v.id,
    organizationId: v.organization_id,
    name: v.name,
  }));

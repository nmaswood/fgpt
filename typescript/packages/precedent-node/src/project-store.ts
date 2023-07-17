import { Project } from "@fgpt/precedent-iso";
import { MAX_PROJECT_LIMIT } from "@fgpt/precedent-iso";
import { DatabasePool, DatabaseTransactionConnection, sql } from "slonik";
import { z } from "zod";

import { ZCountRow } from "./sql/models";

export interface CreateProjectArgs {
  name: string;
  organizationId: string;
  creatorUserId: string;
}

export interface UpdateProject {
  id: string;
  name: string;
}

export interface ProjectStore {
  get: (projectId: string) => Promise<Project | undefined>;
  getMany: (projectIds: string[]) => Promise<Project[]>;
  list: (organizationId: string) => Promise<Project[]>;
  create: (args: CreateProjectArgs) => Promise<Project>;
  delete: (ids: string) => Promise<boolean>;
  deleteMany: (ids: string[]) => Promise<number>;
  update: (args: UpdateProject) => Promise<Project>;
  addToFileCount: (projectId: string, delta: number) => Promise<Project>;
}

const PROJECT_FIELDS = sql.fragment`id, organization_id, name, file_count, created_at`;

export class PSqlProjectStore implements ProjectStore {
  constructor(private readonly pool: DatabasePool) {}

  async list(organizationId: string): Promise<Project[]> {
    const resp = await this.pool.query(
      sql.type(ZProjectRow)`
SELECT
    ${PROJECT_FIELDS}
FROM
    project
WHERE
    organization_id = ${organizationId}
    AND STATUS != 'pending_deletion'
ORDER BY
    created_at DESC
`,
    );
    return Array.from(resp.rows);
  }

  async get(projectId: string): Promise<Project | undefined> {
    const [project] = await this.getMany([projectId]);
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
    id IN (${sql.join(projectIds, sql.fragment`, `)})
`,
      );

      return Array.from(values.rows);
    });
  }

  async create(args: CreateProjectArgs): Promise<Project> {
    return this.pool.connect((cnx) =>
      cnx.transaction((trx) => this.#create(trx, args)),
    );
  }

  async #create(
    trx: DatabaseTransactionConnection,
    { name, organizationId, creatorUserId }: CreateProjectArgs,
  ): Promise<Project> {
    const projectLength = await trx.one(
      sql.type(ZCountRow)`
SELECT
    COUNT(*)
FROM
    project
WHERE
    organization_id = ${organizationId}
`,
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
`,
    );
  }

  async delete(id: string) {
    const count = await this.deleteMany([id]);
    return count === 1;
  }

  // TODO
  async deleteMany(ids: string[]) {
    const res = await this.pool.query(
      sql.unsafe`
UPDATE
    PROJECT
SET
    status = 'pending_deletion'
where
    id IN (${sql.join(ids, sql.fragment`, `)})
`,
    );
    return res.rowCount;
  }

  async addToFileCount(id: string, delta: number): Promise<Project> {
    return this.pool.connect(async (cnx) => {
      const project = await cnx.one(
        sql.type(ZProjectRow)`

UPDATE
    Project
SET
    file_count = COALESCE(file_count, 0) + ${delta}
WHERE
    id = ${id}
RETURNING
    ${PROJECT_FIELDS}
`,
      );

      return project;
    });
  }

  async update({ id, name }: UpdateProject): Promise<Project> {
    return this.pool.connect(async (cnx) => {
      const project = await cnx.one(
        sql.type(ZProjectRow)`
UPDATE
    Project
SET
    name = ${name}
WHERE
    id = ${id}
RETURNING
    ${PROJECT_FIELDS}
`,
      );

      return project;
    });
  }
}

const ZProjectRow = z
  .object({
    id: z.string(),
    organization_id: z.string(),
    name: z.string(),
    file_count: z.number().nullable(),
    created_at: z.number(),
  })
  .transform((v) => ({
    id: v.id,
    organizationId: v.organization_id,
    name: v.name,
    fileCount: v.file_count ?? 0,
    createdAt: new Date(v.created_at),
  }));

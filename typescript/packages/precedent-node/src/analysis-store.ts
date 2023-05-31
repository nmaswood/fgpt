import {
  MAX_ANALYSIS_LIMIT,
  Analysis,
  AnalysisDefinition,
  AnalysisOutput,
  ZAnalysisDefinition,
  ZAnalysisOutput,
} from "@fgpt/precedent-iso";
import { DatabasePool, DatabaseTransactionConnection, sql } from "slonik";
import { z } from "zod";

export interface InsertAnalysis {
  organizationId: string;
  projectId: string;
  name: string;
  definition: AnalysisDefinition;
}

export interface UpdateAnalysis {
  id: string;
  name?: string;
  output?: AnalysisOutput;
  taskId?: string;
}

export interface AnalysisStore {
  get(id: string): Promise<Analysis>;
  getMany(ids: string[]): Promise<Analysis[]>;
  list(projectId: string): Promise<Analysis[]>;
  update(args: UpdateAnalysis): Promise<Analysis>;
  insert(args: InsertAnalysis): Promise<Analysis>;
  insertMany(args: InsertAnalysis[]): Promise<Analysis[]>;
  delete(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
}

const FIELDS = sql.fragment` id, organization_id, project_id, task_id, name, definition, output`;

export class PsqlAnalysisStore implements AnalysisStore {
  constructor(private readonly pool: DatabasePool) {}

  async update({
    id,
    name,
    output,
    taskId,
  }: UpdateAnalysis): Promise<Analysis> {
    return this.pool.one(
      sql.type(ZAnalysisRow)`
UPDATE
    analysis
SET
    name = COALESCE(${name ?? null}, name),
    output = COALESCE(${JSON.stringify(output ?? null)}, output),
    task_id = COALESCE(${taskId ?? null}, task_id)
WHERE
    id = ${id}
RETURNING
    ${FIELDS}
`
    );
  }

  async get(id: string): Promise<Analysis> {
    const [file] = await this.getMany([id]);
    if (!file) {
      throw new Error("file not found");
    }
    return file;
  }

  getMany(ids: string[]): Promise<Analysis[]> {
    const uniq = [...new Set(ids)];
    return this.pool.connect(async (cnx) => {
      const { rows } = await cnx.query(
        sql.type(ZAnalysisRow)`
SELECT
    ${FIELDS}
FROM
    analysis
WHERE
    id IN (${sql.join(uniq, sql.fragment`, `)})
`
      );
      return Array.from(rows);
    });
  }

  async list(projectId: string): Promise<Analysis[]> {
    return this.pool.connect(async (cnx) => {
      const { rows } = await cnx.query(
        sql.type(ZAnalysisRow)`
SELECT
    ${FIELDS}
FROM
    analysis
WHERE
    project_id = ${projectId}
`
      );
      return Array.from(rows);
    });
  }

  async insert(args: InsertAnalysis): Promise<Analysis> {
    const [res] = await this.insertMany([args]);
    if (!res) {
      throw new Error("illegal state");
    }
    return res;
  }

  async insertMany(args: InsertAnalysis[]): Promise<Analysis[]> {
    if (args.length === 0) {
      return [];
    }

    return this.pool.connect((cnx) =>
      cnx.transaction((trx) => this.#insertMany(trx, args))
    );
  }

  async #insertMany(
    trx: DatabaseTransactionConnection,
    args: InsertAnalysis[]
  ): Promise<Analysis[]> {
    const [arg] = args;
    if (!arg) {
      throw new Error("illegal state");
    }

    const count = await trx.oneFirst(sql.type(ZCountRow)`
SELECT
    COUNT(*) as count
FROM
    analysis
where
    project_id = ${arg.projectId}
`);
    if (count >= MAX_ANALYSIS_LIMIT) {
      throw new Error("too many items for this project");
    }

    const values = args.map(
      ({ organizationId, projectId, name, definition }) =>
        sql.fragment`
(${organizationId},
    ${projectId},
    ${name},
    ${JSON.stringify(definition)})
`
    );

    const resp = await trx.query(
      sql.type(ZAnalysisRow)`
INSERT INTO analysis (organization_id, project_id, name, definition)
    VALUES
        ${sql.join(values, sql.fragment`, `)}
    RETURNING
        ${FIELDS}
`
    );

    return Array.from(resp.rows);
  }

  async delete(id: string): Promise<void> {
    await this.deleteMany([id]);
  }

  async deleteMany(ids: string[]): Promise<void> {
    await this.pool.query(sql.unsafe`
DELETE FROM analysis
WHERE id IN (${sql.join(ids, sql.fragment`, `)})
`);
  }
}

const ZAnalysisRow = z
  .object({
    id: z.string(),
    organization_id: z.string(),
    project_id: z.string(),
    task_id: z.string().nullable(),
    name: z.string(),
    definition: ZAnalysisDefinition,
    output: ZAnalysisOutput.nullable(),
  })
  .transform(
    (row): Analysis => ({
      id: row.id,
      organizationId: row.organization_id,
      projectId: row.project_id,
      taskId: row.task_id ?? undefined,
      name: row.name,
      definition: row.definition,
      output: row.output ?? undefined,
    })
  );

const ZCountRow = z.object({
  count: z.number(),
});

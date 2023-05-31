import {
  MAX_REPORT_LIMIT,
  Report,
  ReportDefinition,
  ReportOutput,
  ZReportDefinition,
  ZReportOutput,
} from "@fgpt/precedent-iso";
import { DatabasePool, DatabaseTransactionConnection, sql } from "slonik";
import { z } from "zod";

export interface InsertReport {
  organizationId: string;
  projectId: string;
  name: string;
  definition: ReportDefinition;
}

export interface UpdateReport {
  id: string;
  name?: string;
  output?: ReportOutput;
  taskId?: string;
}

export interface ReportStore {
  get(id: string): Promise<Report>;
  getMany(ids: string[]): Promise<Report[]>;
  list(projectId: string): Promise<Report[]>;
  update(args: UpdateReport): Promise<Report>;
  insert(args: InsertReport): Promise<Report>;
  insertMany(args: InsertReport[]): Promise<Report[]>;
  delete(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
}

const FIELDS = sql.fragment` id, organization_id, project_id, task_id, name, definition, output`;

export class PsqlReportStore implements ReportStore {
  constructor(private readonly pool: DatabasePool) {}

  async update({ id, name, output, taskId }: UpdateReport): Promise<Report> {
    return this.pool.one(
      sql.type(ZReportRow)`
UPDATE
    report
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

  async get(id: string): Promise<Report> {
    const [file] = await this.getMany([id]);
    if (!file) {
      throw new Error("file not found");
    }
    return file;
  }

  getMany(ids: string[]): Promise<Report[]> {
    const uniq = [...new Set(ids)];
    return this.pool.connect(async (cnx) => {
      const { rows } = await cnx.query(
        sql.type(ZReportRow)`
SELECT
    ${FIELDS}
FROM
    report
WHERE
    id IN (${sql.join(uniq, sql.fragment`, `)})
`
      );
      return Array.from(rows);
    });
  }

  async list(projectId: string): Promise<Report[]> {
    return this.pool.connect(async (cnx) => {
      const { rows } = await cnx.query(
        sql.type(ZReportRow)`
SELECT
    ${FIELDS}
FROM
    report
WHERE
    project_id = ${projectId}
`
      );
      return Array.from(rows);
    });
  }

  async insert(args: InsertReport): Promise<Report> {
    const [res] = await this.insertMany([args]);
    if (!res) {
      throw new Error("illegal state");
    }
    return res;
  }

  async insertMany(args: InsertReport[]): Promise<Report[]> {
    if (args.length === 0) {
      return [];
    }

    return this.pool.connect((cnx) =>
      cnx.transaction((trx) => this.#insertMany(trx, args))
    );
  }

  async #insertMany(
    trx: DatabaseTransactionConnection,
    args: InsertReport[]
  ): Promise<Report[]> {
    const [arg] = args;
    if (!arg) {
      throw new Error("illegal state");
    }

    const count = await trx.oneFirst(sql.type(ZCountRow)`
SELECT
    COUNT(*) as count
FROM
    REPORT
where
    project_id = ${arg.projectId}
`);
    if (count >= MAX_REPORT_LIMIT) {
      throw new Error("too many reports for this project");
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
      sql.type(ZReportRow)`
INSERT INTO report (organization_id, project_id, name, definition)
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
DELETE FROM report
WHERE id IN (${sql.join(ids, sql.fragment`, `)})
`);
  }
}

const ZReportRow = z
  .object({
    id: z.string(),
    organization_id: z.string(),
    project_id: z.string(),
    task_id: z.string().nullable(),
    name: z.string(),
    definition: ZReportDefinition,
    output: ZReportOutput.nullable(),
  })
  .transform(
    (row): Report => ({
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

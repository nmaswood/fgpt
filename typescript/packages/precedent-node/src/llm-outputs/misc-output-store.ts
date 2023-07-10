import { Outputs } from "@fgpt/precedent-iso";
import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface InsertMiscValue {
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  processedFileId: string;
  textChunkId: string;
  textChunkGroupId: string;
  value: Outputs.MiscValue;
}

const FIELDS = sql.fragment`id, organization_id, project_id, file_reference_id, processed_file_id, text_chunk_group_id, text_chunk_id, metrics`;
export interface MiscOutputStore {
  textChunkIdsPresent(fileReferenceId: string): Promise<string[]>;
  getForFile(fileReferenceId: string): Promise<Outputs.MiscValue[]>;
  insertMany(metrics: InsertMiscValue[]): Promise<Outputs.MiscValueRow[]>;
}

const ZIdRow = z.object({
  id: z.string(),
});

export class PsqlMiscOutputStore implements MiscOutputStore {
  constructor(private readonly pool: DatabasePool) {}

  async textChunkIdsPresent(fileReferenceId: string): Promise<string[]> {
    const result = await this.pool.query(sql.type(ZIdRow)`
SELECT distinct
    text_chunk_id as id
FROM
    text_chunk_metrics
WHERE
    file_reference_id = ${fileReferenceId}
`);
    return result.rows.map((row) => row.id).sort();
  }

  async getForFile(fileReferenceId: string): Promise<Outputs.MiscValue[]> {
    const result = await this.pool.query(sql.type(
      z.object({ metrics: ZMiscValue }),
    )`
SELECT
    metrics
FROM
    text_chunk_metrics
    JOIN text_chunk ON text_chunk.id = text_chunk_metrics.text_chunk_id
WHERE
    text_chunk_metrics.file_reference_id = ${fileReferenceId}
ORDER BY
    text_chunk.chunk_order ASC
`);
    return result.rows.map((row) => row.metrics);
  }

  async insertMany(
    metrics: InsertMiscValue[],
  ): Promise<Outputs.MiscValueRow[]> {
    if (metrics.length === 0) {
      return [];
    }
    const values = metrics.map(
      ({
        organizationId,
        projectId,
        fileReferenceId,
        processedFileId,
        textChunkGroupId,
        textChunkId,
        value,
      }) =>
        sql.fragment`
(${organizationId},
    ${projectId},
    ${fileReferenceId},
    ${processedFileId},
    ${textChunkGroupId},
    ${textChunkId},
    ${null},
    ${JSON.stringify(value)})
`,
    );

    const res = await this.pool.query(sql.type(ZMetricsRow)`
INSERT INTO text_chunk_metrics (organization_id, project_id, file_reference_id, processed_file_id, text_chunk_group_id, text_chunk_id, value, metrics)
    VALUES
        ${sql.join(values, sql.fragment`, `)}
    RETURNING
        ${FIELDS}
`);

    return Array.from(res.rows);
  }
}

const ZFinancialSummary = z.object({
  investmentRisks: z.string().array(),
  investmentMerits: z.string().array(),
  financialSummaries: z.string().array(),
});

const ZTerm = z.object({
  termValue: z.string(),
  termName: z.string(),
});

const ZMiscValue = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("terms"),
    value: ZTerm.array(),
  }),
  z.object({
    type: z.literal("financial_summary"),
    value: ZFinancialSummary,
  }),
  z.object({
    type: z.literal("summary"),
    value: z.string().array(),
  }),
  z.object({
    type: z.literal("long_form"),
    value: z.string(),
  }),
]);

const ZMetricsRow = z
  .object({
    id: z.string(),
    project_id: z.string(),
    organization_id: z.string(),
    file_reference_id: z.string(),
    processed_file_id: z.string(),
    text_chunk_group_id: z.string(),
    text_chunk_id: z.string(),
    metrics: ZMiscValue,
  })
  .transform(
    (row): Outputs.MiscValueRow => ({
      id: row.id,
      organizationId: row.organization_id,
      projectId: row.project_id,
      fileReferenceId: row.file_reference_id,
      processedFileId: row.processed_file_id,
      textChunkGroupId: row.text_chunk_group_id,
      textChunkId: row.text_chunk_id,
      value: row.metrics,
    }),
  );

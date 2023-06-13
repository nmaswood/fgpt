import { Outputs } from "@fgpt/precedent-iso";
import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface InsertMetric {
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  processedFileId: string;
  textChunkId: string;
  textChunkGroupId: string;
  value: string | undefined;
  description: string | undefined;
}

const FIELDS = sql.fragment`id, organization_id, project_id, file_reference_id, processed_file_id, text_chunk_group_id, text_chunk_id, value, description`;
export interface MetricsStore {
  insertMany(metrics: InsertMetric[]): Promise<Outputs.Metrics[]>;
}

export class PsqlMetricsStore implements MetricsStore {
  constructor(private readonly pool: DatabasePool) {}

  async insertMany(metrics: InsertMetric[]): Promise<Outputs.Metrics[]> {
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
        description,
      }) =>
        sql.fragment`
(${organizationId},
    ${projectId},
    ${fileReferenceId},
    ${processedFileId},
    ${textChunkGroupId},
    ${textChunkId},
    ${value ?? null},
    ${description ?? null},
    ${JSON.stringify({})})
`
    );

    const res = await this.pool.query(sql.type(ZMetricsRow)`
INSERT INTO text_chunk_metrics (organization_id, project_id, file_reference_id, processed_file_id, text_chunk_group_id, text_chunk_id, value, description, metrics)
    VALUES
        ${sql.join(values, sql.fragment`, `)}
    RETURNING
        ${FIELDS}
`);

    return Array.from(res.rows);
  }
}

const ZMetricsRow = z
  .object({
    id: z.string(),
    project_id: z.string(),
    organization_id: z.string(),
    file_reference_id: z.string(),
    processed_file_id: z.string(),
    text_chunk_group_id: z.string(),
    text_chunk_id: z.string(),
    value: z.string().nullable(),
    description: z.string().nullable(),
  })
  .transform(
    (row): Outputs.Metrics => ({
      id: row.id,
      organizationId: row.organization_id,
      projectId: row.project_id,
      fileReferenceId: row.file_reference_id,
      processedFileId: row.processed_file_id,
      textChunkGroupId: row.text_chunk_group_id,
      textChunkId: row.text_chunk_id,
      value: row.value ?? undefined,
      description: row.description ?? undefined,
    })
  );

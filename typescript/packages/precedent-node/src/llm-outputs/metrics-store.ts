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
  metrics: Record<string, any>;
}

const FIELDS = sql.fragment`id, organization_id, project_id, file_reference_id, processed_file_id, text_chunk_group_id, text_chunk_id, metrics`;
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
        metrics,
      }) =>
        sql.fragment`
(${organizationId},
    ${projectId},
    ${fileReferenceId},
    ${processedFileId},
    ${textChunkGroupId},
    ${textChunkId},
    ${JSON.stringify(metrics)})
`
    );

    const res = await this.pool.query(sql.type(ZMetricsRow)`
INSERT INTO text_chunk_metrics (organization_id, project_id, file_reference_id, processed_file_id, text_chunk_group_id, text_chunk_id, metrics)
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
    metrics: z.record(z.string(), z.any()),
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
      metrics: row.metrics,
    })
  );

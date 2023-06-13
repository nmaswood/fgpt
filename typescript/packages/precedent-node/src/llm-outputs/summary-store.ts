import { Outputs } from "@fgpt/precedent-iso";
import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface InsertSummary {
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  processedFileId: string;
  textChunkId: string;
  textChunkGroupId: string;
  summary: string;
  hash: string;
}

const FIELDS = sql.fragment`id, organization_id, project_id, file_reference_id, processed_file_id, text_chunk_group_id, text_chunk_id, summary`;
export interface SummaryStore {
  getForFile(fileReferenceId: string): Promise<string[]>;
  getForChunk(chunkId: string): Promise<string[]>;
  insertMany(summaries: InsertSummary[]): Promise<Outputs.Summary[]>;
}

export class PsqlSummaryStore implements SummaryStore {
  constructor(private readonly pool: DatabasePool) {}

  async getForFile(fileReferenceId: string): Promise<string[]> {
    const result = await this.pool.query(sql.type(ZGetForFile)`
SELECT
    summary
FROM
    text_chunk_summary
WHERE
    file_reference_id = ${fileReferenceId}
`);
    return result.rows.map((row) => row.summary);
  }

  async getForChunk(chunkId: string): Promise<string[]> {
    const result = await this.pool.query(sql.type(ZGetForFile)`
SELECT
    summary
FROM
    text_chunk_summary
WHERE
    text_chunk_id = ${chunkId}
`);
    return result.rows.map((row) => row.summary);
  }

  async insertMany(summaries: InsertSummary[]): Promise<Outputs.Summary[]> {
    if (summaries.length === 0) {
      return [];
    }
    const values = summaries.map(
      ({
        organizationId,
        projectId,
        fileReferenceId,
        processedFileId,
        textChunkGroupId,
        textChunkId,
        summary,
        hash,
      }) =>
        sql.fragment`
(${organizationId},
    ${projectId},
    ${fileReferenceId},
    ${processedFileId},
    ${textChunkGroupId},
    ${textChunkId},
    ${summary},
    ${hash})
`
    );

    const res = await this.pool.query(sql.type(ZSummaryRow)`
INSERT INTO text_chunk_summary (organization_id, project_id, file_reference_id, processed_file_id, text_chunk_group_id, text_chunk_id, summary, hash_sha256)
    VALUES
        ${sql.join(values, sql.fragment`, `)}
    RETURNING
        ${FIELDS}
`);

    return Array.from(res.rows);
  }
}

const ZGetForFile = z.object({
  summary: z.string(),
});

const ZSummaryRow = z
  .object({
    id: z.string(),
    project_id: z.string(),
    organization_id: z.string(),
    file_reference_id: z.string(),
    processed_file_id: z.string(),
    text_chunk_group_id: z.string(),
    text_chunk_id: z.string(),
    summary: z.string(),
  })
  .transform(
    (row): Outputs.Summary => ({
      id: row.id,
      organizationId: row.organization_id,
      projectId: row.project_id,
      fileReferenceId: row.file_reference_id,
      processedFileId: row.processed_file_id,
      textChunkGroupId: row.text_chunk_group_id,
      textChunkId: row.text_chunk_id,
      summary: row.summary,
    })
  );

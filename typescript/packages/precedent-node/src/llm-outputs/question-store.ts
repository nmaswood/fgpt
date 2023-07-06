import { Outputs } from "@fgpt/precedent-iso";
import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface InsertQuestion {
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  processedFileId: string;
  textChunkId: string;
  textChunkGroupId: string;
  question: string;
  hash: string;
}

const FIELDS = sql.fragment`id, organization_id, project_id, file_reference_id, processed_file_id, text_chunk_group_id, text_chunk_id, question`;

export interface QuestionStore {
  sampleForProject(projectId: string, limit: number): Promise<string[]>;
  sampleForFile(fileReferenceId: string, limit: number): Promise<string[]>;
  getForFile(fileReferenceId: string): Promise<string[]>;
  getForChunk(chunkId: string): Promise<string[]>;
  insertMany(questions: InsertQuestion[]): Promise<Outputs.Question[]>;
}

export class PsqlQuestionStore implements QuestionStore {
  constructor(private readonly pool: DatabasePool) {}

  async sampleForProject(projectId: string, limit: number): Promise<string[]> {
    const result = await this.pool.query(sql.type(ZGetForFile)`
SELECT
    question
FROM
    text_chunk_question
WHERE
    project_id = ${projectId}
ORDER BY
    random()
LIMIT ${limit + 10}
`);

    return [...new Set(result.rows.map((row) => row.question))].slice(0, limit);
  }

  async sampleForFile(
    fileReferenceId: string,
    limit: number,
  ): Promise<string[]> {
    const result = await this.pool.query(sql.type(ZGetForFile)`
SELECT
    question
FROM
    text_chunk_question
WHERE
    file_reference_id = ${fileReferenceId}
ORDER BY
    random()
LIMIT ${limit}
`);
    return result.rows.map((row) => row.question);
  }

  async getForFile(fileReferenceId: string): Promise<string[]> {
    const result = await this.pool.query(sql.type(ZGetForFile)`
SELECT
    question
FROM
    text_chunk_question
    JOIN text_chunk ON text_chunk.id = text_chunk_question.text_chunk_id
WHERE
    text_chunk_question.file_reference_id = ${fileReferenceId}
ORDER BY
    text_chunk.chunk_order DESC
`);
    return result.rows.map((row) => row.question);
  }

  async getForChunk(chunkId: string): Promise<string[]> {
    const result = await this.pool.query(sql.type(ZGetForFile)`
SELECT
    question
FROM
    text_chunk_question
WHERE
    text_chunk_id = ${chunkId}
`);
    return result.rows.map((row) => row.question);
  }

  async insertMany(questions: InsertQuestion[]): Promise<Outputs.Question[]> {
    if (questions.length === 0) {
      return [];
    }
    const values = questions.map(
      ({
        organizationId,
        projectId,
        fileReferenceId,
        processedFileId,
        textChunkGroupId,
        textChunkId,
        question,
        hash,
      }) =>
        sql.fragment`
(${organizationId},
    ${projectId},
    ${fileReferenceId},
    ${processedFileId},
    ${textChunkGroupId},
    ${textChunkId},
    ${question},
    ${hash})
`,
    );

    const res = await this.pool.query(sql.type(ZQuestionRow)`
INSERT INTO text_chunk_question (organization_id, project_id, file_reference_id, processed_file_id, text_chunk_group_id, text_chunk_id, question, hash_sha256)
    VALUES
        ${sql.join(values, sql.fragment`, `)}
    RETURNING
        ${FIELDS}
`);

    return Array.from(res.rows);
  }
}

const ZQuestionRow = z
  .object({
    id: z.string(),
    project_id: z.string(),
    organization_id: z.string(),
    file_reference_id: z.string(),
    processed_file_id: z.string(),
    text_chunk_group_id: z.string(),
    text_chunk_id: z.string(),
    question: z.string(),
  })
  .transform(
    (row): Outputs.Question => ({
      id: row.id,
      organizationId: row.organization_id,
      projectId: row.project_id,
      fileReferenceId: row.file_reference_id,
      processedFileId: row.processed_file_id,
      textChunkGroupId: row.text_chunk_group_id,
      textChunkId: row.text_chunk_id,
      question: row.question,
    }),
  );

const ZGetForFile = z.object({
  question: z.string(),
});

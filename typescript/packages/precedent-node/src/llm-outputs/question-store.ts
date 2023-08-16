import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface InsertQuestion {
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  processedFileId: string;
  question: string;
  hash: string;
}

const FIELDS = sql.fragment`question`;

export interface QuestionStore {
  sampleForProject(projectId: string, limit: number): Promise<string[]>;
  sampleForFile(fileReferenceId: string, limit: number): Promise<string[]>;
  insertMany(questions: InsertQuestion[]): Promise<string[]>;
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

  async insertMany(questions: InsertQuestion[]): Promise<string[]> {
    if (questions.length === 0) {
      return [];
    }
    const values = questions.map(
      ({
        organizationId,
        projectId,
        fileReferenceId,
        processedFileId,
        question,
        hash,
      }) =>
        sql.fragment`
(${organizationId},
    ${projectId},
    ${fileReferenceId},
    ${processedFileId},
    ${question},
    ${hash})
`,
    );

    const res = await this.pool.anyFirst(sql.type(ZQuestionRow)`
INSERT INTO text_chunk_question (organization_id, project_id, file_reference_id, processed_file_id, question, hash_sha256)
    VALUES
        ${sql.join(values, sql.fragment`, `)}
    RETURNING
        ${FIELDS}
`);

    return Array.from(res);
  }
}

const ZQuestionRow = z.object({
  question: z.string(),
});

const ZGetForFile = z.object({
  question: z.string(),
});

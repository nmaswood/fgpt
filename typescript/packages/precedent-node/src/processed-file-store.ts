import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface ProcessedFile {
  id: string;
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
}

export interface UpsertProcessedFile {
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  text: string;
  hash: string;
  gpt4TokenLength?: number;
  claude100kLength?: number;
}

export interface ProcessedFileStore {
  upsert(args: UpsertProcessedFile): Promise<ProcessedFile>;
  getText(id: string): Promise<string>;
  getByFileReferenceId(id: string): Promise<ProcessedFile>;
}

const FIELDS = sql.fragment` id, organization_id, project_id, file_reference_id`;

export class PsqlProcessedFileStore implements ProcessedFileStore {
  constructor(private readonly pool: DatabasePool) {}

  async getByFileReferenceId(id: string): Promise<ProcessedFile> {
    return this.pool.one(
      sql.type(ZProcessedFileRow)`
SELECT
    ${FIELDS}
FROM
    processed_file
WHERE
    file_reference_id = ${id}
`,
    );
  }

  async getText(id: string): Promise<string> {
    return this.pool.oneFirst(
      sql.type(ZGetTextRow)`
SELECT
    extracted_text
FROM
    processed_file
WHERE
    id = ${id}
`,
    );
  }

  async upsert(args: UpsertProcessedFile): Promise<ProcessedFile> {
    const [res] = await this.upsertMany([args]);
    if (res === undefined) {
      throw new Error("Upsert failed");
    }
    return res;
  }

  async upsertMany(args: UpsertProcessedFile[]): Promise<ProcessedFile[]> {
    if (args.length === 0) {
      return [];
    }

    return this.#upsertMany(args);
  }

  async #upsertMany(args: UpsertProcessedFile[]): Promise<ProcessedFile[]> {
    const values = args.map(
      ({
        organizationId,
        projectId,
        fileReferenceId,
        text,
        hash,
        gpt4TokenLength,
        claude100kLength,
      }) =>
        sql.fragment`
(${organizationId},
    ${projectId},
    ${fileReferenceId},
    ${text},
    ${hash},
    ${text.length},
    ${gpt4TokenLength ?? null},
    ${claude100kLength ?? null})
`,
    );
    const { rows } = await this.pool.query(
      sql.type(ZProcessedFileRow)`
INSERT INTO processed_file (organization_id, project_id, file_reference_id, extracted_text, extracted_text_sha256, token_length, gpt4_token_length, claude_100k_length)
    VALUES
        ${sql.join(values, sql.fragment`, `)}
    ON CONFLICT (organization_id, project_id, file_reference_id)
        DO UPDATE SET
            extracted_text = COALESCE(EXCLUDED.extracted_text, processed_file.extracted_text)
        RETURNING
            ${FIELDS}
`,
    );

    return Array.from(rows);
  }
}

const ZProcessedFileRow = z
  .object({
    id: z.string(),
    project_id: z.string(),
    organization_id: z.string(),
    file_reference_id: z.string(),
  })
  .transform((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    projectId: row.project_id,
    fileReferenceId: row.file_reference_id,
  }));

const ZGetTextRow = z
  .object({
    extracted_text: z.string(),
  })
  .transform((row) => ({
    extractedText: row.extracted_text,
  }));

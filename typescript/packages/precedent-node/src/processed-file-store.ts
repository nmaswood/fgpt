import { SourceText, TextWithPage, ZTextWithPage } from "@fgpt/precedent-iso";
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
  textWithPages: TextWithPage[];
  numPages: number;
  hash: string;
  gpt4TokenLength: number;
  claude100kLength: number;
}

export interface ProcessedFileStore {
  upsert(args: UpsertProcessedFile): Promise<ProcessedFile>;
  getText(id: string): Promise<string>;
  getSourceText(id: string): Promise<SourceText>;
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
      sql.type(ZGetText)`
SELECT
  extracted_text
FROM
    processed_file
WHERE
    id = ${id}
`,
    );
  }

  async getSourceText(id: string): Promise<SourceText> {
    return this.pool.one(
      sql.type(ZGetSourceText)`
SELECT
CASE WHEN text_with_pages IS NULL THEN extracted_text ELSE NULL END as extracted_text,
    text_with_pages
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
        textWithPages,
        numPages,
      }) =>
        sql.fragment`
(${organizationId},
    ${projectId},
    ${fileReferenceId},
    ${text},
    ${hash},
    ${text.length},
    ${gpt4TokenLength},
    ${claude100kLength},
    ${JSON.stringify(textWithPages)},
    ${numPages})
`,
    );
    const { rows } = await this.pool.query(
      sql.type(ZProcessedFileRow)`
INSERT INTO processed_file (organization_id, project_id, file_reference_id, extracted_text, extracted_text_sha256, token_length, gpt4_token_length, claude_100k_length, text_with_pages, num_pages)
    VALUES
        ${sql.join(values, sql.fragment`, `)}
    ON CONFLICT (organization_id, project_id, file_reference_id)
        DO UPDATE SET
            extracted_text = EXCLUDED.extracted_text, extracted_text_sha256 = EXCLUDED.extracted_text_sha256, token_length = EXCLUDED.token_length, gpt4_token_length = EXCLUDED.gpt4_token_length, claude_100k_length = EXCLUDED.claude_100k_length, text_with_pages = EXCLUDED.text_with_pages, num_pages = EXCLUDED.num_pages
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

const ZGetText = z.object({
  extracted_text: z.string(),
});

const ZGetSourceText = z
  .object({
    extracted_text: z.string().nullable(),
    text_with_pages: ZTextWithPage.array().nullable(),
  })
  .transform((row): SourceText => {
    if (row.extracted_text && row.text_with_pages) {
      throw new Error("Text with pages and extracted text are both present");
    }
    if (row.text_with_pages) {
      return {
        type: "has_pages",
        pages: row.text_with_pages,
      };
    } else if (row.extracted_text) {
      return {
        type: "text_only",
        text: row.extracted_text,
      };
    }
    throw new Error("illegal state");
  });

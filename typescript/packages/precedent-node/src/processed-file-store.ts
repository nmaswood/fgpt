import { DatabasePool, DatabasePoolConnection, sql } from "slonik";
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
}

export interface ProcessedFileStore {
  upsert(args: UpsertProcessedFile): Promise<ProcessedFile>;
  upsertMany(args: UpsertProcessedFile[]): Promise<ProcessedFile[]>;
  getText(id: string): Promise<string>;
}

const FIELDS = sql.fragment` id, organization_id, project_id, file_reference_id`;

export class PsqlProcessedFileStore implements ProcessedFileStore {
  constructor(private readonly pool: DatabasePool) {}

  getText(id: string): Promise<string> {
    return this.pool.connect(async (cnx) => this.#getText(cnx, id));
  }

  async #getText(cnx: DatabasePoolConnection, id: string): Promise<string> {
    return cnx.oneFirst(
      sql.type(ZGetTextRow)`
SELECT
    extracted_text
FROM
    processed_file
WHERE
    id = ${id}
`
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

    return this.pool.connect(async (cnx) => this.#upsertMany(cnx, args));
  }

  async #upsertMany(
    cnx: DatabasePoolConnection,
    args: UpsertProcessedFile[]
  ): Promise<ProcessedFile[]> {
    const values = args.map(
      ({ organizationId, projectId, fileReferenceId, text, hash }) =>
        sql.fragment`

(${organizationId},
    ${projectId},
    ${fileReferenceId},
    ${text},
    ${hash},
    ${text.length})
`
    );
    const { rows } = await cnx.query(
      sql.type(ZProcessedFileRow)`

INSERT INTO processed_file (organization_id, project_id, file_reference_id, extracted_text, extracted_text_sha256, token_length)
    VALUES
        ${sql.join(values, sql.fragment`, `)}
    ON CONFLICT (organization_id, project_id, file_reference_id)
        DO UPDATE SET
            extracted_text = COALESCE(EXCLUDED.extracted_text, processed_file.extracted_text)
        RETURNING
            ${FIELDS}
`
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

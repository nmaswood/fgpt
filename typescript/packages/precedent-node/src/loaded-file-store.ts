import { Cursor, LoadedFile } from "@fgpt/precedent-iso";
import { DatabasePool, DatabasePoolConnection, sql } from "slonik";
import { z } from "zod";

const HARD_CODED_LIMIT = 100;

export interface CursorArguments {
  projectId: string;
  cursor: Cursor<string>;
}

export interface LoadedFileStore {
  paginate(args: CursorArguments): Promise<LoadedFile[]>;
}

export class PsqlLoadedFileStore implements LoadedFileStore {
  constructor(private readonly pool: DatabasePool) {}

  async paginate(args: CursorArguments): Promise<LoadedFile[]> {
    return this.pool.connect(async (cnx) => this.#paginate(cnx, args));
  }

  async #paginate(
    cnx: DatabasePoolConnection,
    { projectId }: CursorArguments
  ): Promise<LoadedFile[]> {
    const { rows } = await cnx.query(
      sql.type(ZLoadedFileRow)`
SELECT
    file_reference.id,
    file_reference.file_name,
    file_reference.content_type,
    file_reference.uploaded_at,
    file_reference.file_size,
    pf.token_length,
    pf.gpt4_token_length,
    tcg.fully_chunked,
    tcg.fully_embedded
FROM
    file_reference
    LEFT JOIN processed_file pf on file_reference.id = pf.file_reference_id
    LEFT JOIN text_chunk_group tcg on pf.id = tcg.processed_file_id
WHERE
    file_reference.project_id = ${projectId}
    AND COALESCE(tcg.embeddings_will_be_generated, TRUE) IS TRUE
ORDER BY
    file_reference.uploaded_at DESC
LIMIT ${HARD_CODED_LIMIT + 1}
`
    );

    if (rows.length === HARD_CODED_LIMIT + 1) {
      throw new Error("too many rows for right now");
    }

    return Array.from(rows);
  }
}

const ZLoadedFileRow = z
  .object({
    id: z.string(),
    file_name: z.string(),
    content_type: z.string(),
    uploaded_at: z.number(),
    file_size: z.number().nullish(),
    token_length: z.number().nullish(),
    gpt4_token_length: z.number().nullish(),
    fully_chunked: z.boolean().nullish(),
    fully_embedded: z.boolean().nullish(),
  })
  .transform(
    (row): LoadedFile => ({
      id: row.id,
      fileName: row.file_name,
      contentType: row.content_type,
      createdAt: new Date(row.uploaded_at),
      fileSize: row.file_size ?? undefined,
      extractedTextLength: row.token_length ?? undefined,
      gpt4TokenLength: row.gpt4_token_length ?? undefined,
      fullyChunked: Boolean(row.fully_chunked),
      fullyEmbedded: Boolean(row.fully_embedded),
    })
  );

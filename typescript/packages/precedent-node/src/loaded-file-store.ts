import { Cursor, getFileType, LoadedFile } from "@fgpt/precedent-iso";
import { DatabasePool, sql } from "slonik";
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

  async paginate({ projectId }: CursorArguments): Promise<LoadedFile[]> {
    const { rows } = await this.pool.query(
      sql.type(ZLoadedFileRow)`
SELECT
    file_reference.id,
    file_reference.file_name,
    file_reference.content_type,
    file_reference.uploaded_at
FROM
    file_reference
WHERE
    file_reference.project_id = ${projectId}
ORDER BY
    file_reference.uploaded_at DESC
LIMIT ${HARD_CODED_LIMIT + 1}
`,
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
  })
  .transform(
    (row): LoadedFile => ({
      id: row.id,
      fileName: row.file_name,
      createdAt: new Date(row.uploaded_at),
      fileType: getFileType(row.content_type),
    }),
  );

import { FileReference } from "@fgpt/precedent-iso";
import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface InsertFileReference {
  fileName: string;
  projectId: string;
  bucketName: string;
  contentType: string;
}

export interface FileReferenceStore {
  list(projectId: string): Promise<FileReference[]>;
  insertMany(args: InsertFileReference[]): Promise<FileReference[]>;
}

const FIELDS = sql.fragment` id, file_name, project_id, content_type`;

export class PsqlFileReferenceStore implements FileReferenceStore {
  constructor(private readonly pool: DatabasePool) {}

  async list(projectId: string): Promise<FileReference[]> {
    return this.pool.connect(async (cnx) => {
      const { rows } = await cnx.query(
        sql.type(ZFileReferenceRow)`
SELECT
    ${FIELDS}
FROM
    file_reference
WHERE
    project_id = ${projectId}
`
      );
      return Array.from(rows);
    });
  }

  async insertMany(args: InsertFileReference[]): Promise<FileReference[]> {
    if (args.length === 0) {
      return [];
    }
    const values = args.map(
      ({ fileName, bucketName, contentType, projectId }) =>
        sql.fragment`(${fileName}, ${bucketName}, ${contentType}, ${projectId})`
    );

    return this.pool.connect(async (cnx) => {
      const resp = await cnx.query(
        sql.type(ZFileReferenceRow)`
INSERT INTO file_reference (file_name, bucket_name, content_type, project_id)
    VALUES
        ${sql.join(values, sql.fragment`, `)}
    RETURNING
        ${FIELDS}
`
      );

      return Array.from(resp.rows);
    });
  }
}

const ZFileReferenceRow = z
  .object({
    id: z.string(),
    file_name: z.string(),
    project_id: z.string(),
    content_type: z.string(),
  })
  .transform((row) => ({
    id: row.id,
    fileName: row.file_name,
    projectId: row.project_id,
    contentType: row.content_type,
  }));

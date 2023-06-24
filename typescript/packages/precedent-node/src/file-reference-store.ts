import { FileReference, MAX_FILE_COUNT } from "@fgpt/precedent-iso";
import { DatabasePool, DatabaseTransactionConnection, sql } from "slonik";
import { z } from "zod";

import { ZCountRow } from "./sql/models";

export interface InsertFileReference {
  fileName: string;
  organizationId: string;
  projectId: string;
  bucketName: string;
  path: string;
  contentType: string;
  sha256?: string;
  fileSize?: number;
}

export interface FileReferenceStore {
  get(fileId: string): Promise<FileReference>;
  getMany(fileIds: string[]): Promise<FileReference[]>;
  list(projectId: string): Promise<FileReference[]>;
  insert(args: InsertFileReference): Promise<FileReference>;
  insertMany(args: InsertFileReference[]): Promise<FileReference[]>;
}

const FIELDS = sql.fragment` id, file_name, organization_id, project_id, content_type, path, bucket_name`;

export class PsqlFileReferenceStore implements FileReferenceStore {
  constructor(private readonly pool: DatabasePool) {}

  async get(fileId: string): Promise<FileReference> {
    const [file] = await this.getMany([fileId]);
    if (!file) {
      throw new Error("file not found");
    }
    return file;
  }

  async getMany(fileIds: string[]): Promise<FileReference[]> {
    if (fileIds.length === 0) {
      return [];
    }
    const uniq = [...new Set(fileIds)];
    return this.pool.connect(async (cnx) => {
      const { rows } = await cnx.query(
        sql.type(ZFileReferenceRow)`
SELECT
    ${FIELDS}
FROM
    file_reference
WHERE
    id IN (${sql.join(uniq, sql.fragment`, `)})
`
      );
      return Array.from(rows);
    });
  }

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

  async insert(args: InsertFileReference): Promise<FileReference> {
    const [res] = await this.insertMany([args]);
    if (!res) {
      throw new Error("illegal state");
    }
    return res;
  }

  async insertMany(args: InsertFileReference[]): Promise<FileReference[]> {
    if (args.length === 0) {
      return [];
    }

    return this.pool.connect((cnx) =>
      cnx.transaction((trx) => this.#insertMany(trx, args))
    );
  }

  async #insertMany(
    trx: DatabaseTransactionConnection,
    args: InsertFileReference[]
  ): Promise<FileReference[]> {
    const [arg] = args;
    if (!arg) {
      throw new Error("illegal state");
    }

    const count = await trx.oneFirst(sql.type(ZCountRow)`
SELECT
    COUNT(*) as count
FROM
    file_reference
where
    project_id = ${arg.projectId}
`);
    if (count >= MAX_FILE_COUNT) {
      throw new Error("too many files for this project");
    }

    const values = args.map(
      ({
        fileName,
        bucketName,
        contentType,
        organizationId,
        projectId,
        path,
        sha256,
        fileSize,
      }) =>
        sql.fragment`
(${fileName},
    ${bucketName},
    ${contentType},
    ${organizationId},
    ${projectId},
    ${path},
    ${sha256 ?? null},
    ${fileSize ?? null})
`
    );

    const resp = await trx.query(
      sql.type(ZFileReferenceRow)`
INSERT INTO file_reference (file_name, bucket_name, content_type, organization_id, project_id, path, hash_sha256, file_size)
    VALUES
        ${sql.join(values, sql.fragment`, `)}
    RETURNING
        ${FIELDS}
`
    );

    return Array.from(resp.rows);
  }
}

const ZFileReferenceRow = z
  .object({
    id: z.string(),
    file_name: z.string(),
    project_id: z.string(),
    organization_id: z.string(),
    content_type: z.string(),
    path: z.string(),
    bucket_name: z.string(),
  })
  .transform((row) => ({
    id: row.id,
    fileName: row.file_name,
    organizationId: row.organization_id,
    projectId: row.project_id,
    contentType: row.content_type,
    path: row.path,
    bucketName: row.bucket_name,
  }));

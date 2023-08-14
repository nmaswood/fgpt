import {
  FileReference,
  FileReferenceMetadata,
  FileStatus,
  MAX_FILE_COUNT,
  ZFileStatus,
  ZTrafficLightAnswer,
} from "@fgpt/precedent-iso";
import { DatabasePool, DatabaseTransactionConnection, sql } from "slonik";
import { z } from "zod";

import { ZCountRow } from "./sql/models";

export interface UpdateFileArgs {
  id: string;
  description?: string;
  status?: FileStatus;
  metadata?: FileReferenceMetadata;
}

export interface InsertFileReference {
  fileName: string;
  organizationId: string;
  projectId: string;
  bucketName: string;
  path: string;
  contentType: string;
  sha256?: string;
  fileSize: number;
}

export interface FileReferenceStore {
  get(fileId: string): Promise<FileReference>;
  getMetadata(fileId: string): Promise<FileReferenceMetadata>;
  getMany(fileIds: string[]): Promise<FileReference[]>;
  update(args: UpdateFileArgs): Promise<FileReference>;
  list(projectId: string): Promise<FileReference[]>;
  insert(args: InsertFileReference): Promise<FileReference>;
  insertMany(args: InsertFileReference[]): Promise<FileReference[]>;
  setThumbnailPath(fileReferenceId: string, path: string): Promise<void>;

  getThumbnailPath(fileReferenceId: string): Promise<string | undefined>;
}

const FIELDS = sql.fragment` id, file_name, organization_id, project_id, content_type, path, bucket_name, uploaded_at, COALESCE(status, 'pending') as status, description, file_size`;

export class PsqlFileReferenceStore implements FileReferenceStore {
  constructor(private readonly pool: DatabasePool) {}

  async get(fileId: string): Promise<FileReference> {
    const [file] = await this.getMany([fileId]);
    if (!file) {
      throw new Error("file not found");
    }
    return file;
  }

  async getMetadata(id: string): Promise<FileReferenceMetadata> {
    return this.pool.one(
      sql.type(ZMetadataRow)`
SELECT
    metadata
FROM
    file_reference
WHERE
    id = ${id}
`,
    );
  }

  async getThumbnailPath(fileReferenceId: string): Promise<string | undefined> {
    const value = await this.pool.maybeOne(
      sql.type(ZThumbnailRow)`
SELECT
    thumbnail_path
FROM
    file_reference
WHERE
    id = ${fileReferenceId}
`,
    );
    return value ?? undefined;
  }

  async getMany(fileIds: string[]): Promise<FileReference[]> {
    if (fileIds.length === 0) {
      return [];
    }
    const uniq = [...new Set(fileIds)];
    const rows = await this.pool.any(
      sql.type(ZFileReferenceRow)`
SELECT
    ${FIELDS}
FROM
    file_reference
WHERE
    id IN (${sql.join(uniq, sql.fragment`, `)})
`,
    );
    return Array.from(rows);
  }

  async list(projectId: string): Promise<FileReference[]> {
    const rows = await this.pool.any(
      sql.type(ZFileReferenceRow)`
SELECT
    ${FIELDS}
FROM
    file_reference
WHERE
    project_id = ${projectId}
`,
    );
    return Array.from(rows);
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

    return this.pool.transaction((trx) => this.#insertMany(trx, args));
  }

  async #insertMany(
    trx: DatabaseTransactionConnection,
    args: InsertFileReference[],
  ): Promise<FileReference[]> {
    const [arg] = args;
    if (!arg) {
      throw new Error("illegal state");
    }

    const count = await trx.oneFirst(sql.type(ZCountRow)`
SELECT
    COALESCE(file_count, 0) as count
FROM
    project
where
    id = ${arg.projectId}
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
`,
    );

    const resp = await trx.query(
      sql.type(ZFileReferenceRow)`
INSERT INTO file_reference (file_name, bucket_name, content_type, organization_id, project_id, path, hash_sha256, file_size)
    VALUES
        ${sql.join(values, sql.fragment`, `)}
    RETURNING
        ${FIELDS}
`,
    );

    return Array.from(resp.rows);
  }

  async setThumbnailPath(fileReferenceId: string, path: string): Promise<void> {
    await this.pool.query(
      sql.unsafe`
UPDATE
    file_reference
SET
    thumbnail_path = ${path}
WHERE
    id = ${fileReferenceId}
`,
    );
  }

  async update({
    id,
    status,
    description,
    metadata,
  }: UpdateFileArgs): Promise<FileReference> {
    return this.pool.one(sql.type(ZFileReferenceRow)`
UPDATE
    file_reference
SET
    status = COALESCE(${status ?? null}, status),
    description = COALESCE(${description ?? null}, description),
    metadata = COALESCE(${metadata ? JSON.stringify(metadata) : null}, metadata)
WHERE
    id = ${id}
RETURNING
    ${FIELDS}
`);
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
    uploaded_at: z.number(),
    status: ZFileStatus,
    description: z.string().nullable(),
    file_size: z.number().nullable(),
  })
  .transform(
    (row): FileReference => ({
      id: row.id,
      fileName: row.file_name,
      organizationId: row.organization_id,
      projectId: row.project_id,
      contentType: row.content_type,
      path: row.path,
      bucketName: row.bucket_name,
      createdAt: new Date(row.uploaded_at),
      status: row.status,
      description: row.description ?? undefined,
      fileSize: row.file_size ?? undefined,
    }),
  );

const ZThumbnailRow = z
  .object({
    thumbnail_path: z.string().nullable(),
  })
  .transform((row) => row.thumbnail_path ?? undefined);

const ZMetadataRow = z
  .object({
    metadata: z
      .object({
        tags: z.array(z.string()).optional(),
        isFinancialDocument: ZTrafficLightAnswer.optional(),
        isCim: ZTrafficLightAnswer.optional(),
      })
      .nullable(),
  })
  .transform((row): FileReferenceMetadata => {
    if (row.metadata === null) {
      return {
        tags: [],
        isFinancialDocument: undefined,
        isCim: undefined,
      };
    }
    return {
      tags: row.metadata.tags ?? [],
      isFinancialDocument: row.metadata.isFinancialDocument ?? undefined,
      isCim: row.metadata.isCim ?? undefined,
    };
  });

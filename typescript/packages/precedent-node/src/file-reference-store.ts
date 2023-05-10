import { DatabasePool, sql } from "slonik";

export interface InsertFileReference {
  fileName: string;
  bucketName: string;
  contentType: string;
}

export interface FileReferenceStore {
  insert(args: InsertFileReference): Promise<void>;
}

export class PsqlFileReferenceStore implements FileReferenceStore {
  constructor(private readonly pool: DatabasePool) {}

  insert({
    fileName,
    bucketName,
    contentType,
  }: InsertFileReference): Promise<void> {
    return this.pool.connect(async (cnx) => {
      await cnx.one(
        sql.unsafe`
INSERT INTO file_reference (file_name, bucket_name, content_type)
    VALUES (${fileName}, ${bucketName}, ${contentType})
RETURNING
    id
`
      );
    });
  }
}

export interface InsertProcessedFile {
  fileReferenceId: string;
  content: string;
}

export interface ProcessedFileStore {
  insert(args: InsertProcessedFile): Promise<void>;
}

export class PsqlProcessedFileStore implements ProcessedFileStore {
  constructor(private readonly pool: DatabasePool) {}

  async insert({
    fileReferenceId,
    content,
  }: InsertProcessedFile): Promise<void> {
    return this.pool.connect(async (cnx) => {
      await cnx.one(
        sql.unsafe`

INSERT INTO processed_file (processed_file_id, content)
    VALUES (${fileReferenceId}, ${content})
RETURNING
    id
`
      );
    });
  }
}

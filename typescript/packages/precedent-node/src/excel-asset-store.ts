import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface ExcelAsset {
  id: string;
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  bucketName: string;
  path: string;
  numSheets: number;
}

export interface InsertExcelAsset {
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  bucketName: string;
  path: string;
  numSheets: number;
}

export interface ExcelAssetStore {
  get(id: string): Promise<ExcelAsset>;
  insert(args: InsertExcelAsset): Promise<ExcelAsset>;
  list(fileReferenceId: string): Promise<ExcelAsset[]>;
}

const FIELDS = sql.fragment` id, organization_id, project_id, file_reference_id, bucket_name, path, num_sheets`;

export class PsqlExcelAssetStore implements ExcelAssetStore {
  constructor(private readonly pool: DatabasePool) {}

  async get(id: string): Promise<ExcelAsset> {
    return this.pool.one(sql.type(ZExcelAssetRow)`
SELECT
    ${FIELDS}
FROM
    excel_asset
WHERE
    id = ${id}
`);
  }

  async insert(args: InsertExcelAsset): Promise<ExcelAsset> {
    const [res] = await this.#insertMany([args]);
    if (res === undefined) {
      throw new Error("Upsert failed");
    }
    return res;
  }

  async #insertMany(args: InsertExcelAsset[]): Promise<ExcelAsset[]> {
    const values = args.map(
      ({
        organizationId,
        projectId,
        fileReferenceId,
        bucketName,
        path,
        numSheets,
      }) =>
        sql.fragment`
(${organizationId},
    ${projectId},
    ${fileReferenceId},
    ${bucketName},
    ${path},
    ${numSheets})
`,
    );
    const { rows } = await this.pool.query(
      sql.type(ZExcelAssetRow)`
INSERT INTO excel_asset (organization_id, project_id, file_reference_id, bucket_name, path, num_sheets)
    VALUES
        ${sql.join(values, sql.fragment`, `)}
    RETURNING
        ${FIELDS}
`,
    );

    return Array.from(rows);
  }

  async list(fileReferenceId: string): Promise<ExcelAsset[]> {
    const { rows } = await this.pool.query(
      sql.type(ZExcelAssetRow)`
SELECT
    ${FIELDS}
FROM
    excel_asset
WHERE
    file_reference_id = ${fileReferenceId}
`,
    );

    return Array.from(rows);
  }
}

const ZExcelAssetRow = z
  .object({
    id: z.string(),
    project_id: z.string(),
    organization_id: z.string(),
    file_reference_id: z.string(),
    bucket_name: z.string(),
    path: z.string(),
    num_sheets: z.number(),
  })
  .transform(
    (row): ExcelAsset => ({
      id: row.id,
      organizationId: row.organization_id,
      projectId: row.project_id,
      fileReferenceId: row.file_reference_id,
      bucketName: row.bucket_name,
      path: row.path,
      numSheets: row.num_sheets,
    }),
  );

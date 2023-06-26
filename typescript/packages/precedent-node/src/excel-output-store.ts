import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface ExcelOutput {
  id: string;
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  excelAssetId: string;
  sheetNumber: number;
  output: Record<string, unknown>;
}

export interface InsertExcelOutput {
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  excelAssetId: string;
}

export interface ForFileReference {
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  excelAssetId: string;
  outputs: Record<number, Record<string, unknown>>;
}

export interface ExcelOutputStore {
  insertMany(
    foreignKeys: InsertExcelOutput,
    outputs: Record<number, Record<string, unknown>>
  ): Promise<void>;
  forFileReference(
    fileReferenceId: string
  ): Promise<ForFileReference | undefined>;
}

const FIELDS = sql.fragment` id, organization_id, project_id, file_reference_id, excel_asset_id, sheet_number, output`;

export class PsqlExcelOutputStore implements ExcelOutputStore {
  constructor(private readonly pool: DatabasePool) {}

  async insertMany(
    {
      organizationId,
      projectId,
      fileReferenceId,
      excelAssetId,
    }: InsertExcelOutput,
    outputs: Record<number, Record<string, unknown>>
  ): Promise<void> {
    const values = Object.entries(outputs).map(
      ([sheetNumber, output]) =>
        sql.fragment`
(${organizationId},
    ${projectId},
    ${fileReferenceId},
    ${excelAssetId},
    ${Number(sheetNumber)},
    ${JSON.stringify(output)})
`
    );

    await this.pool.query(
      sql.unsafe`
INSERT INTO excel_analysis (organization_id, project_id, file_reference_id, excel_asset_id, sheet_number, output)
    VALUES
        ${sql.join(values, sql.fragment`, `)}
`
    );
  }

  async forFileReference(
    fileReferenceId: string
  ): Promise<ForFileReference | undefined> {
    const { rows } = await this.pool.query(
      sql.type(ZExcelOutputRow)`

SELECT
    ${FIELDS}
FROM
    excel_analysis
WHERE
    file_reference_id = ${fileReferenceId}
`
    );
    const [row] = rows;
    if (!row) {
      return undefined;
    }

    const output: Record<number, Record<string, unknown>> = {};
    for (const { sheetNumber, output: sheetOutput } of rows) {
      output[sheetNumber] = sheetOutput;
    }

    return {
      organizationId: row.organizationId,
      projectId: row.projectId,
      fileReferenceId: row.fileReferenceId,
      excelAssetId: row.excelAssetId,
      outputs: output,
    };
  }
}

const ZExcelOutputRow = z
  .object({
    id: z.string(),
    project_id: z.string(),
    organization_id: z.string(),
    file_reference_id: z.string(),
    excel_asset_id: z.string(),
    sheet_number: z.number(),
    output: z.record(z.unknown()),
  })
  .transform(
    (row): ExcelOutput => ({
      id: row.id,
      organizationId: row.organization_id,
      projectId: row.project_id,
      fileReferenceId: row.file_reference_id,
      excelAssetId: row.excel_asset_id,
      sheetNumber: row.sheet_number,
      output: row.output,
    })
  );

import {
  AnalyzeOutput,
  ExcelSource,
  ZAnalyzeTableModel,
} from "@fgpt/precedent-iso";
import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface ExcelOutput {
  id: string;
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  source: ExcelSource;
  output: AnalyzeOutput;
}

export interface InsertExcelOutput {
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  excelAssetId: string | undefined;
  output: AnalyzeOutput;
}

export interface ExcelOutputStore {
  insert(args: InsertExcelOutput): Promise<ExcelOutput>;
  forDirectUpload(fileReferenceId: string): Promise<ExcelOutput[]>;
  forDerived(fileReferenceId: string): Promise<ExcelOutput[]>;
}

const FIELDS = sql.fragment` id, organization_id, project_id, file_reference_id, excel_asset_id, output`;

export class PsqlExcelOutputStore implements ExcelOutputStore {
  constructor(private readonly pool: DatabasePool) {}

  async insert({
    organizationId,
    projectId,
    fileReferenceId,
    excelAssetId,
    output,
  }: InsertExcelOutput): Promise<ExcelOutput> {
    const value = await this.pool.one(
      sql.type(ZExcelOutputRow)`
INSERT INTO excel_analysis (organization_id, project_id, file_reference_id, excel_asset_id, output)
    VALUES (${organizationId}, ${projectId}, ${fileReferenceId}, ${
      excelAssetId ?? null
    }, ${JSON.stringify(output)})
RETURNING
    ${FIELDS}
`,
    );
    return value ?? undefined;
  }

  async forDirectUpload(fileReferenceId: string): Promise<ExcelOutput[]> {
    return this.#forFileReference(fileReferenceId, "direct-upload");
  }

  async forDerived(fileReferenceId: string): Promise<ExcelOutput[]> {
    return this.#forFileReference(fileReferenceId, "derived");
  }

  async #forFileReference(
    fileReferenceId: string,
    source: "direct-upload" | "derived",
  ): Promise<ExcelOutput[]> {
    const value = await this.pool.query(
      sql.type(ZExcelOutputRow)`
SELECT
    ${FIELDS}
FROM
    excel_analysis
WHERE
    file_reference_id = ${fileReferenceId}
    AND excel_asset_id IS ${
      source === "direct-upload" ? sql.fragment`NULL` : sql.fragment`NOT NULL`
    }
`,
    );

    return Array.from(value.rows);
  }
}

const ZAnalyzeOutput = z.object({
  type: z.literal("v0_chunks"),
  value: z
    .object({
      sheetNames: z.array(z.string()),
      content: z.string(),
      sanitizedHtml: z.string().optional(),
    })
    .array(),
  model: ZAnalyzeTableModel.optional(),
});

const ZExcelOutputRow = z
  .object({
    id: z.string(),
    project_id: z.string(),
    organization_id: z.string(),
    file_reference_id: z.string(),
    excel_asset_id: z.string().nullable(),
    output: ZAnalyzeOutput,
  })
  .transform(
    (row): ExcelOutput => ({
      id: row.id,
      organizationId: row.organization_id,
      projectId: row.project_id,
      fileReferenceId: row.file_reference_id,
      source: row.excel_asset_id
        ? {
            type: "derived",
            excelAssetId: row.excel_asset_id,
          }
        : {
            type: "direct-upload",
          },
      output: {
        type: "v0_chunks",
        value: row.output.value.map((chunk) => ({
          sheetNames: chunk.sheetNames,
          content: chunk.content,
          sanitizedHtml: chunk.sanitizedHtml,
        })),
        model: row.output.model ?? "gpt",
      },
    }),
  );

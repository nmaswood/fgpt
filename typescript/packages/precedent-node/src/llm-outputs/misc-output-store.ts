import {
  assertNever,
  isNotNull,
  Outputs,
  ZPromptSlug,
} from "@fgpt/precedent-iso";
import { MiscValue } from "@fgpt/precedent-iso/src/models/llm-outputs";
import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface InsertMiscValue {
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  processedFileId: string;
  value: Outputs.MiscValue;
}

const FIELDS = sql.fragment`value`;
export interface MiscOutputStore {
  getForFile(fileReferenceId: string): Promise<Outputs.MiscValue[]>;
  insertMany(values: InsertMiscValue[]): Promise<Outputs.MiscValue[]>;
  insert(value: InsertMiscValue): Promise<Outputs.MiscValue>;
}

export class PsqlMiscOutputStore implements MiscOutputStore {
  constructor(private readonly pool: DatabasePool) {}

  async getForFile(fileReferenceId: string): Promise<Outputs.MiscValue[]> {
    const result = await this.pool.anyFirst(sql.type(ZGetValueForFile)`
SELECT
    value
FROM
    misc_output
WHERE
    file_reference_id = ${fileReferenceId}
`);

    return result.filter(isNotNull);
  }

  async insert(value: InsertMiscValue): Promise<Outputs.MiscValue> {
    const [res] = await this.insertMany([value]);
    if (!res) {
      throw new Error("invalid state");
    }
    return res;
  }

  async insertMany(values: InsertMiscValue[]): Promise<Outputs.MiscValue[]> {
    if (values.length === 0) {
      return [];
    }
    const sqlValues = values.map(
      ({
        organizationId,
        projectId,
        fileReferenceId,
        processedFileId,
        value,
      }) =>
        sql.fragment`
(${organizationId},
    ${projectId},
    ${fileReferenceId},
    ${processedFileId},
    ${JSON.stringify(value)})
`,
    );

    const res = await this.pool.any(sql.type(ZRow)`
INSERT INTO misc_output (organization_id, project_id, file_reference_id, processed_file_id, value)
    VALUES
        ${sql.join(sqlValues, sql.fragment`, `)}
    RETURNING
        ${FIELDS}
`);

    return res.filter(isNotNull);
  }
}

const ZTerm = z.object({
  termValue: z.string(),
  termName: z.string(),
});

const ZMiscValue = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("terms"),
      value: ZTerm.array(),
      order: z
        .number()
        .optional()
        .transform((row) => row ?? undefined),
    }),
    z.object({
      type: z.literal("output"),
      slug: ZPromptSlug,
      raw: z.string(),
      html: z.string().optional(),
    }),
    z.object({
      type: z.literal("financial_summary"),
    }),
    z.object({
      type: z.literal("summary"),
    }),
    z.object({
      type: z.literal("long_form"),
      raw: z.string().optional(),
      value: z.string().optional(),
      sanitizedHtml: z.string().nullable().optional(),
      html: z.string().nullable().optional(),
    }),
  ])
  .transform((row): MiscValue | undefined => {
    switch (row.type) {
      case "financial_summary":
      case "summary":
        // these fields are deprecated
        return undefined;
      case "terms":
        return {
          type: "terms",
          value: row.value,
          order: row.order,
        };
      case "long_form":
        return {
          type: "long_form",
          raw: row.value ?? row.raw ?? "",
          html: row.sanitizedHtml ?? row.html ?? undefined,
        };
      case "output":
        return {
          type: "output",
          slug: row.slug,
          raw: row.raw,
          html: row.html,
        };
      default:
        assertNever(row);
    }
  });

const ZGetValueForFile = z.object({
  value: ZMiscValue,
});

const ZRow = z
  .object({
    value: ZMiscValue,
  })
  .transform((row): Outputs.MiscValue | undefined => {
    return row.value ?? undefined;
  });

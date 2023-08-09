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
  textChunkId?: string | undefined;
  textChunkGroupId?: string | undefined;
  value: Outputs.MiscValue;
}

const FIELDS = sql.fragment`id, text_chunk_group_id, text_chunk_id, value`;
export interface MiscOutputStore {
  textChunkIdsPresent(fileReferenceId: string): Promise<string[]>;
  getForFile(fileReferenceId: string): Promise<Outputs.MiscValue[]>;
  insertMany(values: InsertMiscValue[]): Promise<Outputs.MiscValueRow[]>;
  insert(value: InsertMiscValue): Promise<Outputs.MiscValueRow>;
}

const ZIdRow = z.object({
  id: z.string().nullable(),
});

export class PsqlMiscOutputStore implements MiscOutputStore {
  constructor(private readonly pool: DatabasePool) {}

  async textChunkIdsPresent(fileReferenceId: string): Promise<string[]> {
    const result = await this.pool.anyFirst(sql.type(ZIdRow)`
SELECT
    text_chunk_id as id
FROM
    misc_output
WHERE
    file_reference_id = ${fileReferenceId}
`);
    return [...new Set(result.filter(isNotNull))].sort();
  }

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

  async insert(value: InsertMiscValue): Promise<Outputs.MiscValueRow> {
    const [res] = await this.insertMany([value]);
    if (!res) {
      throw new Error("invalid state");
    }
    return res;
  }

  async insertMany(values: InsertMiscValue[]): Promise<Outputs.MiscValueRow[]> {
    if (values.length === 0) {
      return [];
    }
    const sqlValues = values.map(
      ({
        organizationId,
        projectId,
        fileReferenceId,
        processedFileId,
        textChunkGroupId,
        textChunkId,
        value,
      }) =>
        sql.fragment`
(${organizationId},
    ${projectId},
    ${fileReferenceId},
    ${processedFileId},
    ${textChunkGroupId ?? null},
    ${textChunkId ?? null},
    ${JSON.stringify(value)})
`,
    );

    const res = await this.pool.any(sql.type(ZRow)`
INSERT INTO misc_output (organization_id, project_id, file_reference_id, processed_file_id, text_chunk_group_id, text_chunk_id, value)
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
    id: z.string(),
    text_chunk_group_id: z.string().nullable(),
    text_chunk_id: z.string().nullable(),
    value: ZMiscValue,
  })
  .transform((row): Outputs.MiscValueRow | undefined => {
    if (!row.value) {
      return undefined;
    }

    const chunk = row.text_chunk_id
      ? row.text_chunk_group_id
        ? {
            textChunkId: row.text_chunk_id,
            textChunkGroupId: row.text_chunk_group_id,
          }
        : undefined
      : undefined;

    return {
      id: row.id,
      chunk,
      value: row.value,
    };
  });

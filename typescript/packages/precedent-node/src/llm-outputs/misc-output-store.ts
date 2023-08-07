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

const FIELDS = sql.fragment`id, text_chunk_group_id, text_chunk_id, metrics`;
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
    text_chunk_metrics
WHERE
    file_reference_id = ${fileReferenceId}
`);
    return [...new Set(result.filter(isNotNull))].sort();
  }

  async getForFile(fileReferenceId: string): Promise<Outputs.MiscValue[]> {
    const result = await this.pool.anyFirst(sql.type(ZGetMetricsForFile)`
SELECT
    metrics
FROM
    text_chunk_metrics
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

  async insertMany(
    metrics: InsertMiscValue[],
  ): Promise<Outputs.MiscValueRow[]> {
    if (metrics.length === 0) {
      return [];
    }
    const values = metrics.map(
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
    ${null},
    ${JSON.stringify(value)})
`,
    );

    const res = await this.pool.any(sql.type(ZMetricsRow)`
INSERT INTO text_chunk_metrics (organization_id, project_id, file_reference_id, processed_file_id, text_chunk_group_id, text_chunk_id, value, metrics)
    VALUES
        ${sql.join(values, sql.fragment`, `)}
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

const ZGetMetricsForFile = z.object({
  metrics: ZMiscValue,
});

const ZMetricsRow = z
  .object({
    id: z.string(),
    text_chunk_group_id: z.string().nullable(),
    text_chunk_id: z.string().nullable(),
    metrics: ZMiscValue,
  })
  .transform((row): Outputs.MiscValueRow | undefined => {
    if (!row.metrics) {
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
      value: row.metrics,
    };
  });

import { ChunkStrategy, TextChunkGroup } from "@fgpt/precedent-iso";
import {
  DatabasePool,
  DatabaseTransactionConnection,
  QueryResult,
  sql,
} from "slonik";
import { z } from "zod";

const EMBEDDING_INFO = {
  type: "ada-002",
  size: 1536,
} as const;

export interface TextChunk {
  id: string;
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  processedFileId: string;
  textChunkGroupId: string;
  chunkOrder: number;
  chunkText: string;
  hasEmbedding: boolean;
}

export interface UpsertTextChunkCommon {
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  processedFileId: string;
  textChunkGroupId: string;
}

export interface UpsertTextChunk {
  chunkOrder: number;
  chunkText: string;
  hash: string;
}

export interface UpsertTextChunkGroup {
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  processedFileId: string;
  numChunks: number;
  strategy: ChunkStrategy;
  embeddingsWillBeGenerated: boolean;
}

export interface EmbeddingResult {
  chunkId: string;
  embedding: number[];
}

export interface SetManyEmbeddings {
  chunkId: string;
  embedding: number[];
}

export interface TextChunkStore {
  iterateTextChunks(
    limit: number,
    textChunkGroupId: string,
  ): AsyncIterable<TextChunk[]>;
  getTextChunkGroup(id: string): Promise<TextChunkGroup>;
  getTextChunkGroupByFileId(
    strategy: ChunkStrategy,
    id: string,
  ): Promise<TextChunkGroup>;

  getTextChunkById(id: string): Promise<TextChunk>;
  getTextChunkByOrder(groupId: string, order: number): Promise<TextChunk>;

  upsertTextChunkGroup(args: UpsertTextChunkGroup): Promise<TextChunkGroup>;
  upsertManyTextChunkGroups(
    args: UpsertTextChunkGroup[],
  ): Promise<TextChunkGroup[]>;

  getTextChunks(ids: string[]): Promise<TextChunk[]>;

  upsertTextChunk(
    common: UpsertTextChunkCommon,
    args: UpsertTextChunk,
  ): Promise<TextChunk>;

  upsertManyTextChunks(
    common: UpsertTextChunkCommon,
    args: UpsertTextChunk[],
  ): Promise<TextChunk[]>;

  setManyEmbeddings(args: SetManyEmbeddings[]): Promise<TextChunk[]>;

  getEmbedding(ids: string): Promise<EmbeddingResult>;
  getEmbeddings(ids: string[]): Promise<EmbeddingResult[]>;

  getTextChunkGroupByStrategy(
    fileReferenceId: string,
    strategy: ChunkStrategy,
  ): Promise<TextChunkGroup | undefined>;
}

const TEXT_CHUNK_FIELDS = sql.fragment`text_chunk.id, text_chunk.organization_id, text_chunk.project_id, text_chunk.file_reference_id, text_chunk.processed_file_id, text_chunk.chunk_order, text_chunk.chunk_text, text_chunk.embedding IS NOT NULL AS has_embedding, text_chunk_group_id`;

const TEXT_CHUNK_GROUP_FIELDS = sql.fragment`text_chunk_group.id, organization_id, project_id, file_reference_id, processed_file_id, num_chunks`;

export class PsqlTextChunkStore implements TextChunkStore {
  constructor(private readonly pool: DatabasePool) {}

  async *iterateTextChunks(
    limit: number,
    textChunkGroupId: string,
  ): AsyncIterable<TextChunk[]> {
    let id: string | undefined = undefined;

    while (true) {
      const fragment = id
        ? sql.fragment`AND text_chunk.id > ${id}`
        : sql.fragment``;

      const resp: QueryResult<z.infer<typeof ZTextChunkRow>> = await this.pool
        .query(sql.type(ZTextChunkRow)`
SELECT
    ${TEXT_CHUNK_FIELDS}
FROM
    text_chunk
WHERE
    text_chunk_group_id = ${textChunkGroupId} ${fragment}
ORDER BY
    text_chunk.id ASC
LIMIT ${limit}
`);
      if (resp.rowCount === 0) {
        return;
      }
      yield Array.from(resp.rows);
      const lastId = resp.rows.at(-1)?.id;
      if (!lastId) {
        throw new Error("illegal state");
      }
      id = lastId;
    }
  }

  async getTextChunkGroupByStrategy(
    fileId: string,
    strategy: ChunkStrategy,
  ): Promise<TextChunkGroup | undefined> {
    const res = await this.pool.maybeOne(sql.type(ZTextChunkGroupRow)`
SELECT
    ${TEXT_CHUNK_GROUP_FIELDS}
FROM
    text_chunk_group
WHERE
    file_reference_id = ${fileId}
    and chunk_strategy = ${strategy}
LIMIT 1
`);
    return res ?? undefined;
  }

  async getTextChunkGroup(id: string): Promise<TextChunkGroup> {
    return this.pool.connect(async (cnx) => {
      return cnx.one(sql.type(ZTextChunkGroupRow)`
SELECT
    ${TEXT_CHUNK_GROUP_FIELDS}
FROM
    text_chunk_group
WHERE
    id = ${id}
`);
    });
  }

  async getTextChunkById(id: string): Promise<TextChunk> {
    return this.pool.one(
      sql.type(ZTextChunkRow)`
SELECT
    ${TEXT_CHUNK_FIELDS}
FROM
    text_chunk
WHERE
    id = ${id}
`,
    );
  }

  async getTextChunkByOrder(
    groupId: string,
    order: number,
  ): Promise<TextChunk> {
    return this.pool.one(
      sql.type(ZTextChunkRow)`
SELECT
    ${TEXT_CHUNK_FIELDS}
FROM
    text_chunk
WHERE
    text_chunk_group_id = ${groupId}
    AND chunk_order = ${order}
`,
    );
  }

  async getTextChunkGroupByFileId(
    strategy: ChunkStrategy,
    fileId: string,
  ): Promise<TextChunkGroup> {
    return this.pool.connect(async (cnx) => {
      return cnx.one(sql.type(ZTextChunkGroupRow)`
SELECT
    ${TEXT_CHUNK_GROUP_FIELDS}
FROM
    text_chunk_group
WHERE
    file_reference_id = ${fileId}
    and chunk_strategy = ${strategy}
`);
    });
  }

  async upsertTextChunkGroup(
    args: UpsertTextChunkGroup,
  ): Promise<TextChunkGroup> {
    const [res] = await this.upsertManyTextChunkGroups([args]);
    if (!res) {
      throw new Error("upsert failed");
    }
    return res;
  }

  async upsertManyTextChunkGroups(
    args: UpsertTextChunkGroup[],
  ): Promise<TextChunkGroup[]> {
    if (args.length === 0) {
      return [];
    }
    return this.pool.transaction((trx) =>
      this.#upsertManyTextChunkGroups(trx, args),
    );
  }

  async #upsertManyTextChunkGroups(
    trx: DatabaseTransactionConnection,
    args: UpsertTextChunkGroup[],
  ): Promise<TextChunkGroup[]> {
    const values = args.map(
      ({
        organizationId,
        projectId,
        fileReferenceId,
        processedFileId,
        numChunks,
        strategy,
        embeddingsWillBeGenerated,
      }) =>
        sql.fragment`
(${organizationId},
    ${projectId},
    ${fileReferenceId},
    ${processedFileId},
    ${numChunks},
    ${strategy},
    ${EMBEDDING_INFO.type},
    ${EMBEDDING_INFO.size},
    ${embeddingsWillBeGenerated})
`,
    );
    // fix this later
    const { rows } = await trx.query(
      sql.type(ZTextChunkGroupRow)`
INSERT INTO text_chunk_group (organization_id, project_id, file_reference_id, processed_file_id, num_chunks, chunk_strategy, embedding_strategy, embedding_size, embeddings_will_be_generated)
    VALUES
        ${sql.join(values, sql.fragment`, `)}
    ON CONFLICT (organization_id, project_id, file_reference_id, processed_file_id, chunk_strategy, embedding_strategy)
        DO UPDATE set
            num_chunks = EXCLUDED.num_chunks
        RETURNING
            ${TEXT_CHUNK_GROUP_FIELDS}
`,
    );

    return Array.from(rows);
  }

  async getEmbedding(id: string): Promise<EmbeddingResult> {
    const [embeddings] = await this.getEmbeddings([id]);
    if (!embeddings) {
      throw new Error("not found");
    }
    return embeddings;
  }

  async getEmbeddings(ids: string[]): Promise<EmbeddingResult[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.#getEmbeddings(ids);
  }

  async #getEmbeddings(ids: string[]): Promise<EmbeddingResult[]> {
    const resp = await this.pool.query(
      sql.type(ZEmbeddingRow)`
SELECT
    id,
    embedding
FROM
    text_chunk
WHERE
    id IN (${sql.join(ids, sql.fragment`, `)})
`,
    );
    return Array.from(resp.rows);
  }

  async setManyEmbeddings(args: SetManyEmbeddings[]): Promise<TextChunk[]> {
    if (args.length === 0) {
      return [];
    }

    return this.pool.transaction(async (trx) =>
      this.#setManyEmbeddings(trx, args),
    );
  }

  async #setManyEmbeddings(
    trx: DatabaseTransactionConnection,
    args: SetManyEmbeddings[],
  ): Promise<TextChunk[]> {
    const rows = args.map(
      ({ chunkId, embedding }) =>
        sql.fragment`
(${chunkId}::uuid,
    ${sql.jsonb(JSON.stringify(embedding))})
`,
    );
    const resp = await trx.query(
      sql.type(ZTextChunkRow)`
UPDATE
    text_chunk
SET
    embedding = c.embedding
FROM (
    VALUES ${sql.join(rows, sql.fragment`, `)}) c (id, embedding)
WHERE
    text_chunk.id = c.id
RETURNING
    ${TEXT_CHUNK_FIELDS}
`,
    );

    return Array.from(resp.rows);
  }

  async getTextChunks(ids: string[]): Promise<TextChunk[]> {
    if (ids.length === 0) {
      return [];
    }

    const res = await this.pool.query(
      sql.type(ZTextChunkRow)`
SELECT
    ${TEXT_CHUNK_FIELDS}
FROM
    text_chunk
WHERE
    id IN (${sql.join(ids, sql.fragment`, `)})
`,
    );

    return Array.from(res.rows);
  }

  async upsertTextChunk(
    common: UpsertTextChunkCommon,
    args: UpsertTextChunk,
  ): Promise<TextChunk> {
    const [res] = await this.upsertManyTextChunks(common, [args]);
    if (res === undefined) {
      throw new Error("failed to upsert text chunk");
    }
    return res;
  }

  async upsertManyTextChunks(
    common: UpsertTextChunkCommon,
    args: UpsertTextChunk[],
  ): Promise<TextChunk[]> {
    if (args.length === 0) {
      return [];
    }

    return this.pool.transaction((trx) =>
      this.#upsertManyTextChunks(trx, common, args),
    );
  }

  async #upsertManyTextChunks(
    trx: DatabaseTransactionConnection,
    common: UpsertTextChunkCommon,
    args: UpsertTextChunk[],
  ): Promise<TextChunk[]> {
    const values = args.map(
      ({ chunkOrder, chunkText, hash }) =>
        sql.fragment`
(${common.organizationId},
    ${common.projectId},
    ${common.fileReferenceId},
    ${common.processedFileId},
    ${common.textChunkGroupId},
    ${chunkOrder},
    ${chunkText},
    ${hash})
`,
    );

    const { rows } = await trx.query(
      sql.type(ZTextChunkRow)`
INSERT INTO text_chunk (organization_id, project_id, file_reference_id, processed_file_id, text_chunk_group_id, chunk_order, chunk_text, chunk_text_sha256)
    VALUES
        ${sql.join(values, sql.fragment`, `)}
    ON CONFLICT (organization_id, project_id, file_reference_id, processed_file_id, text_chunk_group_id, chunk_order)
        DO UPDATE set
            chunk_order = EXCLUDED.chunk_order
        RETURNING
            ${TEXT_CHUNK_FIELDS}
`,
    );

    return Array.from(rows);
  }
}

const ZTextChunkGroupRow = z
  .object({
    id: z.string(),
    project_id: z.string(),
    organization_id: z.string(),
    file_reference_id: z.string(),
    processed_file_id: z.string(),
    num_chunks: z.number(),
  })
  .transform((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    projectId: row.project_id,
    fileReferenceId: row.file_reference_id,
    processedFileId: row.processed_file_id,
    numChunks: row.num_chunks,
  }));

const ZTextChunkRow = z
  .object({
    id: z.string(),
    project_id: z.string(),
    organization_id: z.string(),
    file_reference_id: z.string(),
    processed_file_id: z.string(),
    text_chunk_group_id: z.string(),
    chunk_order: z.number(),
    chunk_text: z.string(),
    has_embedding: z.boolean(),
  })
  .transform((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    projectId: row.project_id,
    fileReferenceId: row.file_reference_id,
    processedFileId: row.processed_file_id,
    textChunkGroupId: row.text_chunk_group_id,
    chunkOrder: row.chunk_order,
    chunkText: row.chunk_text,
    hasEmbedding: row.has_embedding,
  }));

const ZEmbeddingRow = z
  .object({
    id: z.string(),
    embedding: z.string(),
  })
  .transform((row) => ({
    chunkId: row.id,
    embedding: JSON.parse(row.embedding),
  }));

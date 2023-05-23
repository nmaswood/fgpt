import { DatabasePool, DatabasePoolConnection, sql } from "slonik";
import { z } from "zod";

export interface TextChunk {
  id: string;
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  processedFileId: string;
  chunkOrder: number;
  chunkText: string;
  hasEmbedding: boolean;
}

export interface UpsertTextChunk {
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  processedFileId: string;
  chunkOrder: number;
  chunkText: string;
  hash: string;
}

export interface EmbeddingResult {
  chunkId: string;
  embedding: number[];
  embeddingSize: number;
}

export interface SetManyEmbeddings {
  chunkId: string;
  embedding: number[];
}
export interface TextChunkStore {
  upsertMany(args: UpsertTextChunk[]): Promise<TextChunk[]>;
  setManyEmbeddings(args: SetManyEmbeddings[]): Promise<TextChunk[]>;

  getEmbedding(ids: string): Promise<EmbeddingResult>;
  getEmbeddings(ids: string[]): Promise<EmbeddingResult[]>;
  listWithNoEmbeddings(processedFileId: string): Promise<TextChunk[]>;
}

const FIELDS = sql.fragment`text_chunk.id, organization_id, project_id, file_reference_id, processed_file_id, chunk_order, chunk_text, text_chunk.embedding IS NOT NULL AS has_embedding`;
export class PsqlTextChunkStore implements TextChunkStore {
  constructor(private readonly pool: DatabasePool) {}

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
    return this.pool.connect(async (cnx) => this.#getEmbeddings(cnx, ids));
  }

  async #getEmbeddings(
    cnx: DatabasePoolConnection,
    ids: string[]
  ): Promise<EmbeddingResult[]> {
    const resp = await cnx.query(
      sql.type(ZEmbeddingRow)`
SELECT
    id,
    embedding,
    embedding_size
FROM
    text_chunk
WHERE
    id IN (${sql.join(ids, sql.fragment`, `)})
`
    );
    return Array.from(resp.rows);
  }

  async setManyEmbeddings(args: SetManyEmbeddings[]): Promise<TextChunk[]> {
    if (args.length === 0) {
      return [];
    }

    return this.pool.connect(async (cnx) => this.#setManyEmbeddings(cnx, args));
  }

  async #setManyEmbeddings(
    cnx: DatabasePoolConnection,
    args: SetManyEmbeddings[]
  ): Promise<TextChunk[]> {
    const rows = args.map(({ chunkId, embedding }) => {
      return sql.fragment`
(${chunkId}::uuid,
    ${sql.jsonb(JSON.stringify(embedding))},
    ${embedding.length}::int)
`;
    });
    const resp = await cnx.query(
      sql.type(ZTextChunkRow)`
UPDATE
    text_chunk
SET
    embedding = c.embedding,
    embedding_size = c.embedding_size
FROM (
    VALUES ${sql.join(
      rows,
      sql.fragment`, `
    )}) c (id, embedding, embedding_size)
WHERE
    text_chunk.id = c.id
RETURNING
    ${FIELDS}
`
    );
    return Array.from(resp.rows);
  }

  async listWithNoEmbeddings(processedFileId: string): Promise<TextChunk[]> {
    return this.pool.connect(async (cnx) => {
      const resp = await cnx.query(
        sql.type(ZTextChunkRow)`
SELECT
    ${FIELDS}
FROM
    text_chunk
WHERE
    processed_file_id = ${processedFileId}
    AND embedding IS NULL
ORDER BY
    chunk_order ASC
`
      );
      return Array.from(resp.rows);
    });
  }

  async upsertMany(args: UpsertTextChunk[]): Promise<TextChunk[]> {
    if (args.length === 0) {
      return [];
    }

    return this.pool.connect(async (cnx) => this.#upsertMany(cnx, args));
  }

  async #upsertMany(
    cnx: DatabasePoolConnection,
    args: UpsertTextChunk[]
  ): Promise<TextChunk[]> {
    const values = args.map(
      ({
        organizationId,
        projectId,
        fileReferenceId,
        processedFileId,
        chunkOrder,
        chunkText,
        hash,
      }) =>
        sql.fragment`
(${organizationId},
    ${projectId},
    ${fileReferenceId},
    ${processedFileId},
    ${chunkOrder},
    ${chunkText},
    ${hash},
    'greedy_v0')
`
    );
    // fix this later
    const { rows } = await cnx.query(
      sql.type(ZTextChunkRow)`
INSERT INTO text_chunk (organization_id, project_id, file_reference_id, processed_file_id, chunk_order, chunk_text, chunk_text_sha256, chunk_strategy)
    VALUES
        ${sql.join(values, sql.fragment`, `)}
    ON CONFLICT (organization_id, project_id, file_reference_id, processed_file_id, chunk_order, chunk_text_sha256)
        DO UPDATE SET
            chunk_text_sha256 = EXCLUDED.chunk_text_sha256
        RETURNING
            ${FIELDS}
`
    );

    return Array.from(rows);
  }
}

const ZTextChunkRow = z
  .object({
    id: z.string(),
    project_id: z.string(),
    organization_id: z.string(),
    file_reference_id: z.string(),
    processed_file_id: z.string(),
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
    chunkOrder: row.chunk_order,
    chunkText: row.chunk_text,
    hasEmbedding: row.has_embedding,
  }));

const ZEmbeddingRow = z
  .object({
    id: z.string(),
    embedding: z.string(),
    embedding_size: z.number(),
  })
  .transform((row) => ({
    chunkId: row.id,
    embedding: JSON.parse(row.embedding),
    embeddingSize: row.embedding_size,
  }));

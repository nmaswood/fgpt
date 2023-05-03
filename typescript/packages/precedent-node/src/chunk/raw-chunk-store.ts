import { DatabasePool, sql } from "slonik";

export interface RawChunk {
  transcriptContentId: string;
  content: string;
  numTokens: number;
}

export interface RawChunkStore {
  insertMany(rawChunks: RawChunk[]): Promise<void>;
}

export class PsqlRawChunkStore implements RawChunkStore {
  constructor(private readonly pool: DatabasePool) {}

  async insertMany(chunks: RawChunk[]): Promise<void> {
    const rawChunkValues = chunks.map(
      (chunk) =>
        sql.fragment`(${chunk.transcriptContentId}, ${chunk.content}, ${chunk.numTokens})`
    );

    return this.pool.connect(async (cnx) => {
      await cnx.query(
        sql.unsafe`

INSERT INTO raw_chunk (id, transcript_content_id, content, num_tokens)
    VALUES
        ${sql.join(rawChunkValues, sql.fragment`, `)}
    ON CONFLICT (id)
        DO NOTHING;

`
      );
    });
  }
}

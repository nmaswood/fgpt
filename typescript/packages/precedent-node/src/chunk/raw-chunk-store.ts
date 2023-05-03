import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface RawChunk {
  id: string;
  transcriptContentId: string | undefined;
  content: string;
  numTokens: number;
}

export interface RawChunkStore {
  insertMany(rawChunks: Omit<RawChunk, "id">[]): Promise<RawChunk[]>;
}

export class PsqlRawChunkStore implements RawChunkStore {
  constructor(private readonly pool: DatabasePool) {}

  async insertMany(chunks: Omit<RawChunk, "id">[]): Promise<RawChunk[]> {
    const rawChunkValues = chunks.map(
      (chunk) =>
        sql.fragment`(${chunk.transcriptContentId ?? null}, ${chunk.content}, ${
          chunk.numTokens
        })`
    );

    return this.pool.connect(async (cnx) => {
      const result = await cnx.query(
        sql.type(
          z.object({
            id: z.string(),
            transcript_content_id: z.string().nullable(),
            content: z.string(),
            num_tokens: z.number(),
          })
        )`
INSERT INTO raw_chunk (transcript_content_id, content, num_tokens)
    VALUES
        ${sql.join(rawChunkValues, sql.fragment`, `)}
    RETURNING
        id, transcript_content_id, content, num_tokens;

`
      );

      return result.rows.map((r) => ({
        id: r.id,
        transcriptContentId: r.transcript_content_id ?? undefined,
        numTokens: r.num_tokens,
        content: r.content,
      }));
    });
  }

  async fetchForTranscriptId(transcriptId: string): Promise<string[]> {
    return this.pool.connect(async (cnx) => {
      const result = await cnx.query(
        sql.type(
          z.object({
            content: z.string(),
          })
        )`
SELECT
    content
FROM
    raw_chunk
WHERE
    transcript_content_id = ${transcriptId}
ORDER BY
    id ASC
`
      );

      return result.rows.map((r) => r.content);
    });
  }
}

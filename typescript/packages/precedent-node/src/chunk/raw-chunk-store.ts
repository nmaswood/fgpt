import { ZSelectId } from "@fgpt/precedent-iso";
import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface RawChunk {
  transcriptContentId: string | undefined;
  content: string;
  numTokens: number;
}

export interface RawChunkStore {
  insertMany(rawChunks: RawChunk[]): Promise<string[]>;
}

export class PsqlRawChunkStore implements RawChunkStore {
  constructor(private readonly pool: DatabasePool) {}

  async insertMany(chunks: RawChunk[]): Promise<string[]> {
    const rawChunkValues = chunks.map(
      (chunk) =>
        sql.fragment`(${chunk.transcriptContentId ?? null}, ${chunk.content}, ${
          chunk.numTokens
        })`
    );

    return this.pool.connect(async (cnx) => {
      const result = await cnx.query(
        sql.type(ZSelectId)`

INSERT INTO raw_chunk (transcript_content_id, content, num_tokens)
    VALUES
        ${sql.join(rawChunkValues, sql.fragment`, `)}
    RETURNING
        id;

`
      );

      return result.rows.map((r) => r.id);
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

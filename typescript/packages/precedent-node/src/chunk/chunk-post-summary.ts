import { ZSelectId } from "@fgpt/precedent-iso";
import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface ChunkPostSummary {
  summaryId: string;
  content: string;
  embedding: number[];
}

export interface LoadedChunkPostSummary {
  ticker: string;
  hrefId: string;
  transcriptContentId: string;
  chunkId: string;
  postSummaryChunkId: string;
  summaryId: string;
  embedding: number[];
}
export interface ChunkPostSummaryStore {
  insertMany(chunks: ChunkPostSummary[]): Promise<string[]>;
  get(): AsyncIterator<LoadedChunkPostSummary>;
}

export class PsqlChunkPostSummaryStore implements ChunkPostSummaryStore {
  constructor(private readonly pool: DatabasePool) {}
  async insertMany(chunks: ChunkPostSummary[]): Promise<string[]> {
    return this.pool.connect(async (cnx) => {
      const rawChunkValues = chunks.map(
        ({ summaryId, content, embedding }) =>
          sql.fragment`(${summaryId}, ${content}, ${JSON.stringify({
            embedding,
          })})`
      );

      const resp = await cnx.query(
        sql.type(ZSelectId)`

INSERT INTO chunk_post_summary (summary_id, content, embedding)
    VALUES
        ${sql.join(rawChunkValues, sql.fragment`, `)}
    RETURNING
        id;

`
      );

      return resp.rows.map((row) => row.id);
    });
  }

  async *get(): AsyncIterator<LoadedChunkPostSummary, any, undefined> {
    let lastId: string | undefined = undefined;

    while (true) {
      const rows = await this.pool.connect(async (cnx) => {
        const response = await cnx.query(
          sql.type(
            z.object({
              ticker: z.string(),
              hrefId: z.string(),
              transcriptContentId: z.string(),
              chunkId: z.string(),
              summaryId: z.string(),
              postSummaryChunkId: z.string(),
              embedding: z.number().array(),
            })
          )`

SELECT
    TH.ticker,
    TC.href_id as hrefId,
    TC.id as transcriptContentId,
    RC.id as chunkId,
    S.id as summaryId,
    CPS.id as postSummaryChunkId,
    CPS.embedding
FROM
    transcript_href TH
    JOIN transcript_content TC on TH.id = tc.href_id
    JOIN raw_chunk RC ON RC.transcript_content_id = TC.id
    JOIN summary S ON S.raw_chunk_id = RC.id
    JOIN chunk_post_summary CPS ON CPS.summary_id = S.id
WHERE
    ${
      lastId === undefined
        ? sql.fragment`WHERE TRUE`
        : sql.fragment` WHERE id > ${lastId}`
    }
ORDER BY
    CPS.id ASC;

`
        );

        return response.rows;
      });
      if (rows.length === 0) {
        return;
      }

      yield* rows;
      const lastIdFromRows = rows.at(-1)?.postSummaryChunkId;
      if (lastIdFromRows === undefined) {
        throw new Error("illegal state");
      }
      lastId = lastIdFromRows;
    }
  }
}

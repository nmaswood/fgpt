import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface Transcript {
  transcriptContentId: string;
  hrefId: string;
  text: string;
}

export interface TranscriptForProcessing {
  getTranscripts(): AsyncIterable<Transcript>;
}

export class PsqlTranscriptForProcessing implements TranscriptForProcessing {
  constructor(private readonly pool: DatabasePool) {}
  async *getTranscripts(): AsyncIterable<Transcript> {
    let lastId: string | undefined = undefined;
    while (true) {
      const rows = await this.pool.connect(async (cnx) => {
        const response = await cnx.query(
          sql.type(
            z.object({
              id: z.string(),
              href_id: z.string(),
              text: z.string().array(),
            })
          )`
SELECT
    id,
    href_id,
    jsonb_path_query_array(content, '$[*].text') as text
FROM
    transcript_content TC
WHERE
    TC.id NOT IN (
        SELECT
            TC.id
        FROM
            transcript_content TC
            JOIN raw_chunk RC ON RC.transcript_content_id = TC.id
            JOIN summary S ON S.raw_chunk_id = RC.id
            JOIN chunk_post_summary CPS ON CPS.summary_id = S.id)
        AND ${
          lastId === undefined
            ? sql.fragment`TRUE`
            : sql.fragment` id > ${lastId}`
        }
    ORDER BY
        id ASC
    LIMIT 100
`
        );

        return response.rows;
      });
      if (rows.length === 0) {
        return;
      }

      yield* rows.map((r) => ({
        transcriptContentId: r.id,
        hrefId: r.href_id,
        text: r.text.join(" "),
      }));
      const lastIdFromRows = rows.at(-1)?.id;
      if (lastIdFromRows === undefined) {
        throw new Error("illegal state");
      }
      lastId = lastIdFromRows;
    }

    //
  }
}

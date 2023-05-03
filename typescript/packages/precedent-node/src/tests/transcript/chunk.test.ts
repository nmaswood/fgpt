import { sql } from "slonik";
import { beforeEach, test } from "vitest";

import { PsqlRawChunkStore } from "../../chunk/raw-chunk-store";
import { dataBasePool } from "../../data-base-pool";
import { PsqlTranscriptStore } from "../../transcript/transcript-store";
import { TEST_SETTINGS } from "../test-settings";

async function setup() {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  const rawChunkStore = new PsqlRawChunkStore(pool);
  const transcriptStore = new PsqlTranscriptStore(pool);
  return {
    pool,
    rawChunkStore,
    transcriptStore,
  };
}

beforeEach(async () => {
  const { pool } = await setup();

  await pool.query(
    sql.unsafe`TRUNCATE TABLE chunk_post_summary, summary, raw_chunk CASCADE`
  );
});

test("raw-chunk-store", async () => {
  const { transcriptStore, rawChunkStore } = await setup();
  await transcriptStore.upsertHref({
    tickers: ["AAPL"],
    quarter: "Q1",
    year: "2021",
    href: "https://example.com",
    title: "foo",
  });
});

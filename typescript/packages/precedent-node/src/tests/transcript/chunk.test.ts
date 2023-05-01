import { sql } from "slonik";
import { beforeEach, test } from "vitest";

import { dataBasePool } from "../../data-base-pool";
import { PsqlTranscriptStore } from "../../transcript/transcript-store";
import { TEST_SETTINGS } from "../test-settings";

async function setup() {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);
  const transcriptStore = new PsqlTranscriptStore(pool);
  return {
    pool,
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
  const { transcriptStore } = await setup();
  console.log({ transcriptStore });
});

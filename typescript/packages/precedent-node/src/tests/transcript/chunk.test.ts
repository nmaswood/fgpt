import { countTokens, GreedyTextChunker } from "@fgpt/precedent-iso";
import { sql } from "slonik";
import { beforeEach, expect, test } from "vitest";

import { PsqlRawChunkStore } from "../../chunk/raw-chunk-store";
import { dataBasePool } from "../../data-base-pool";
import { PsqlTranscriptStore } from "../../transcript/transcript-store";
import { TEST_SETTINGS } from "../test-settings";

async function setup() {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  const rawChunkStore = new PsqlRawChunkStore(pool);
  const transcriptStore = new PsqlTranscriptStore(pool);
  const chunker = new GreedyTextChunker();
  return {
    pool,
    rawChunkStore,
    transcriptStore,
    chunker,
  };
}

beforeEach(async () => {
  const { pool } = await setup();

  await pool.query(
    sql.unsafe`TRUNCATE TABLE chunk_post_summary, summary, raw_chunk CASCADE`
  );
});

test("raw-chunk-store", async () => {
  const { chunker, transcriptStore, rawChunkStore } = await setup();
  const hrefId = await transcriptStore.upsertHref({
    tickers: ["AAPL"],
    quarter: "Q1",
    year: "2021",
    href: "https://example.com",
    title: "foo",
  });

  const transcriptContentId = await transcriptStore.storeTranscript(hrefId, {
    blocks: [{ isStrong: false, text: "foo baz baz baz foo" }],
  });

  const chunks = chunker.chunk({
    tokenChunkLimit: 3,
    text: "foo baz baz baz foo",
  });

  await rawChunkStore.insertMany(
    chunks.map((content) => ({
      content,
      transcriptContentId,
      numTokens: content.length,
    }))
  );

  const fetched = await rawChunkStore.fetchForTranscriptId(transcriptContentId);

  expect(new Set(fetched)).toEqual(
    new Set(["baz", "baz", "foo", "baz", "foo"])
  );
});

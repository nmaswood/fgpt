import { GreedyTextChunker } from "@fgpt/precedent-iso";
import { sql } from "slonik";
import { beforeEach, expect, test } from "vitest";

import { PsqlChunkPostSummaryStore } from "../../chunk/chunk-post-summary";
import { PsqlRawChunkStore } from "../../chunk/raw-chunk-store";
import { PsqlSummaryStore } from "../../chunk/summary-store";
import { dataBasePool } from "../../data-base-pool";
import { PsqlTranscriptStore } from "../../transcript/transcript-store";
import { TEST_SETTINGS } from "../test-settings";

async function setup() {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  const rawChunkStore = new PsqlRawChunkStore(pool);
  const transcriptStore = new PsqlTranscriptStore(pool);
  const summaryStore = new PsqlSummaryStore(pool);
  const chunker = new GreedyTextChunker();
  const chunkPostSummaryStore = new PsqlChunkPostSummaryStore(pool);
  return {
    pool,
    rawChunkStore,
    transcriptStore,
    chunker,
    summaryStore,
    chunkPostSummaryStore,
  };
}

beforeEach(async () => {
  const { pool } = await setup();

  await pool.query(
    sql.unsafe`TRUNCATE TABLE chunk_post_summary, summary, raw_chunk CASCADE`
  );
});

test("raw-chunk-store", async () => {
  const {
    chunker,
    transcriptStore,
    rawChunkStore,
    summaryStore,
    chunkPostSummaryStore,
  } = await setup();
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

  const [rawChunk] = await rawChunkStore.insertMany(
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

  const fakeSummary = "this is a fake summary dude";
  const summary = await summaryStore.insert({
    rawChunkId: rawChunk.id,
    content: fakeSummary,
    numTokens: fakeSummary.length,
    diff: 2,
  });

  await chunkPostSummaryStore.insertMany([
    {
      summaryId: summary.id,
      content: "This is just a chunk",
      embedding: [1, 2, 3],
    },
  ]);
});

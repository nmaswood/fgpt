import { collect } from "@fgpt/precedent-iso";
import { sql } from "slonik";
import { beforeEach, expect, test } from "vitest";

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
    sql.unsafe`TRUNCATE TABLE transcript_href,transcript_content CASCADE`
  );
});

test("upsertHref", async () => {
  const { transcriptStore } = await setup();

  for (let i = 0; i < 10; i++) {
    await transcriptStore.upsertHref({
      tickers: ["AAPL"],
      quarter: "Q1",
      year: "2021",
      href: "https://example.com",
      title: "foo",
    });
  }
  const values = await collect(transcriptStore.unprocessedHrefs());

  expect(values.length).toEqual(1);
  const [{ id }] = values;

  await transcriptStore.storeTranscript(id, {
    blocks: [
      {
        text: "hi",
        isStrong: false,
      },
    ],
  });
  expect((await collect(transcriptStore.unprocessedHrefs())).length).toEqual(0);

  const value = await transcriptStore.getTickers();
  expect(value).toEqual(["AAPL"]);

  const textForTickers = await transcriptStore.getTextForTicker("AAPL");

  expect(textForTickers).toEqual("hi");
});

//test("unprocessedHrefs", async () => {
//const { transcriptStore } = await setup();

//await transcriptStore.upsertHref({
//tickers: ["AAPL"],
//quarter: "Q1",
//year: "2021",
//href: "https://example.com",
//title: "foo",
//});

//await transcriptStore.upsertHref({
//tickers: ["GOOG"],
//quarter: "Q2",
//year: "2021",
//href: "https://googl.com",
//title: "baz",
//});

//const values = await collect(transcriptStore.unprocessedHrefs());

//expect(values.length).toEqual(2);

//await transcriptStore.storeTranscript(values[0]!.id, {
//blocks: [
//{
//text: "hi",
//isStrong: false,
//},
//],
//});

//const valuesPrime = await collect(transcriptStore.unprocessedHrefs());

//expect(valuesPrime.length).toEqual(1);
//});

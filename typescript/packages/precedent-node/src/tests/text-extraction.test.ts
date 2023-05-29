import * as F from "node:fs/promises";

import * as cheerio from "cheerio";
import { expect, test } from "vitest";

import { TikaHttpClient } from ".././tika/tika-client";
import { TEST_SETTINGS } from "./test-settings";

async function setup() {
  const tikaClient = new TikaHttpClient(TEST_SETTINGS.tikaClient);
  return {
    tikaClient,
  };
}

test("extract", async () => {
  const { tikaClient } = await setup();
  const fileName = "dummy.pdf";
  const buffer = await F.readFile(`${__dirname}/test-documents/dummy.pdf`);
  const text = await tikaClient.extract(fileName, buffer);
  const xml = cheerio.load(text);
  const bodyText = xml("body").text().trim();
  expect(bodyText.includes("Dummy")).toBeTruthy();
});

test("extract-longer", async () => {
  const { tikaClient } = await setup();
  const fileName = "dummy.pdf";
  const buffer = await F.readFile(
    `${__dirname}/test-documents/sample-pitch.pdf`
  );
  const text = await tikaClient.extract(fileName, buffer);
  const xml = cheerio.load(text);
  const bodyText = xml("body").text().trim();
  expect(bodyText.includes("Business Intermediary")).toBeTruthy();
});

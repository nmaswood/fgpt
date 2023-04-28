import * as dotenv from "dotenv";

dotenv.config();

import { assertNever } from "@fgpt/precedent-iso";
import { dataBasePool, PsqlTranscriptStore } from "@fgpt/precedent-node";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { LOGGER } from "./logger";
import { PuppeteerEarningsCallHrefFetcher } from "./seeking-alpha/earnings-call-href-fetcher";
import { FetchAndStoreEarningCallsDataImpl } from "./seeking-alpha/run";
import { PuppeteerTranscriptFetcher } from "./seeking-alpha/transcript";
import { SETTINGS, Settings } from "./settings";

puppeteer.use(StealthPlugin());

LOGGER.info("Server starting ...");

async function start(settings: Settings) {
  const pool = await dataBasePool(settings.sql.uri);

  const transcriptStore = new PsqlTranscriptStore(pool);

  switch (settings.jobType) {
    case "get-earnings-call-href": {
      const browser = await puppeteer.launch({
        headless: false,
      });
      const transcriptFetcher = new PuppeteerTranscriptFetcher(browser);
      const earningsCallFetcher = new PuppeteerEarningsCallHrefFetcher(browser);

      const storeTrainingData = new FetchAndStoreEarningCallsDataImpl(
        transcriptStore,
        transcriptFetcher,
        earningsCallFetcher
      );
      await storeTrainingData.run({ skipHrefs: true });

      break;
    }
    default:
      assertNever(settings.jobType);
  }

  //
}

start(SETTINGS);

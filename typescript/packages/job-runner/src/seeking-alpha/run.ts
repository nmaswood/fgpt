import * as T from "node:timers/promises";

import { TranscriptStore } from "@fgpt/precedent-node";

import { LOGGER } from "../logger";
import { EarningsCallHrefFetcher } from "./earnings-call-href-fetcher";
import { TranscriptFetcher } from "./transcript";

export interface RunOptions {
  skipHrefs: boolean;
}

export interface FetchAndStoreEarningsCallData {
  run(opts: RunOptions): Promise<void>;
}

export class FetchAndStoreEarningCallsDataImpl
  implements FetchAndStoreEarningsCallData
{
  constructor(
    private readonly transcriptStore: TranscriptStore,
    private readonly transcriptFetcher: TranscriptFetcher,
    private readonly earningsCallHrefFetcher: EarningsCallHrefFetcher
  ) {}

  async run(opts: RunOptions): Promise<void> {
    LOGGER.info("inside of run", { opts });

    if (!opts.skipHrefs) {
      LOGGER.info("fetching hrefs", { opts });

      try {
        for await (const href of this.earningsCallHrefFetcher.getLinks({
          maxPages: 10,
        })) {
          LOGGER.info(`Upserting ${href.title}`);
          await this.transcriptStore.upsertHref(href);
        }
      } catch (e) {
        console.error(e);
        console.warn("Skipping hrefs it errored out!");
      }
    }

    LOGGER.info("about to fetch transcripts", { opts });
    for await (const { id, href } of this.transcriptStore.unprocessedHrefs()) {
      LOGGER.info(`Fetching ${href}`);
      const transcript = await this.transcriptFetcher.getTranscript(href);
      await this.transcriptStore.storeTranscript(id, { blocks: transcript });
      await T.setTimeout(5_000);
    }
  }
}

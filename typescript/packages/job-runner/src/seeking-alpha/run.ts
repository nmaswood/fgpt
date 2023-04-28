import { TranscriptStore } from "@fgpt/precedent-node";

import { EarningsCallHrefFetcher } from "./earnings-call-href-fetcher";
import { TranscriptFetcher } from "./transcript";

export interface StoreTrainingData {
  run(): Promise<void>;
}

export class StoreTrainingDataImpl implements StoreTrainingData {
  constructor(
    private readonly transcriptStore: TranscriptStore,
    private readonly transcriptFetcher: TranscriptFetcher,
    private readonly earningsCallHrefFetcher: EarningsCallHrefFetcher
  ) {}

  async run(): Promise<void> {
    for await (const href of this.earningsCallHrefFetcher.getLinks({
      maxPages: 10,
    })) {
      await this.transcriptStore.upsertHref(href);
    }

    for await (const { id, href } of this.transcriptStore.unprocessedHrefs()) {
      const transcript = await this.transcriptFetcher.getTranscript(href);
      await this.transcriptStore.storeTranscript(id, { blocks: transcript });
    }
  }
}

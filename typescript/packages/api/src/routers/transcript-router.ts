import { TranscriptStore, MLServiceClient } from "@fgpt/precedent-node";

import express from "express";

export class TranscriptRouter {
  constructor(
    private readonly transcriptStore: TranscriptStore,
    private readonly mlService: MLServiceClient
  ) {}

  init() {
    const router = express.Router();

    router.get(
      "/tickers",
      async (_: express.Request, res: express.Response) => {
        const tickers = await this.transcriptStore.getTickers();
        res.json({ tickers });
      }
    );

    router.get(
      "/tickers-with-summaries",
      async (_: express.Request, res: express.Response) => {
        const tickers = await this.transcriptStore.getTickersWithSummary();
        res.json({ tickers });
      }
    );

    router.post(
      "/data-for-ticker/:ticker",
      async (req: express.Request, res: express.Response) => {
        const { ticker } = req.params;
        if (typeof ticker !== "string") {
          throw new Error("illegal state");
        }

        const content = await this.transcriptStore.getTextForTicker(ticker);
        const summary = await this.transcriptStore.fetchSummaries(ticker);
        const data = await this.mlService.predict({
          content: summary.join(" "),
        });

        res.json({ resp: data.response, content, summary });
      }
    );

    return router;
  }
}

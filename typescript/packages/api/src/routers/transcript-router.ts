import { TranscriptStore } from "@fgpt/precedent-node";
import express from "express";

export class TranscriptRouter {
  constructor(private readonly transcriptStore: TranscriptStore) {}

  init() {
    const router = express.Router();

    router.get(
      "/tickers",
      async (_: express.Request, res: express.Response) => {
        const tickers = await this.transcriptStore.getTickers();
        res.json({ tickers });
      }
    );

    return router;
  }
}

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

    router.post(
      "/data-for-ticker/:ticker",
      async (req: express.Request, res: express.Response) => {
        const { ticker } = req.params;
        if (typeof ticker !== "string") {
          throw new Error("illegal state");
        }

        res.json({ ticker });
      }
    );

    return router;
  }
}

import {
  ChunkPostSummaryStore,
  MLServiceClient,
  TranscriptStore,
} from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

const ZAskQuestion = z.object({
  question: z.string(),
  ticker: z.string().optional(),
});

export class TranscriptRouter {
  constructor(
    private readonly transcriptStore: TranscriptStore,
    private readonly mlService: MLServiceClient,
    private readonly chunkPostSummaryStore: ChunkPostSummaryStore
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

    router.post(
      "/ask-question",
      async (req: express.Request, res: express.Response) => {
        const body = ZAskQuestion.parse(req.body);

        const vector = await this.mlService.getEmbedding(body.question);

        const similar = await this.mlService.getKSimilar({
          vector,
          metadata: body.ticker ? { ticker: body.ticker } : {},
        });

        const summaries = await this.chunkPostSummaryStore.getMany(similar);

        const summaryTexts = summaries.map((s) => s.content);

        const answer = await this.mlService.askQuestion({
          context: summaryTexts.join(" "),
          question: body.question,
        });

        res.json({ summaries: summaryTexts, answer });
      }
    );

    return router;
  }
}

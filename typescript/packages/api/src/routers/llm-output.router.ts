import { QuestionStore, SummaryStore } from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class LLMOutputRouter {
  constructor(
    private readonly summaryStore: SummaryStore,
    private readonly questionStore: QuestionStore
  ) {}
  init() {
    const router = express.Router();

    router.get(
      "/output/:fileReferenceId",
      async (req: express.Request, res: express.Response) => {
        const body = ZListChatRequest.parse(req.params);

        const [questions, summaries] = await Promise.all([
          this.questionStore.getForFile(body.fileReferenceId),
          this.summaryStore.getForFile(body.fileReferenceId),
        ]);
        res.json({ questions, summaries });
      }
    );

    return router;
  }
}

const ZListChatRequest = z.object({ fileReferenceId: z.string() });

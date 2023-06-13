import {
  MLServiceClient,
  QuestionStore,
  SummaryStore,
  TextChunkStore,
} from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class LLMOutputRouter {
  constructor(
    private readonly summaryStore: SummaryStore,
    private readonly questionStore: QuestionStore,
    private readonly mlService: MLServiceClient,
    private readonly chunkStore: TextChunkStore
  ) {}
  init() {
    const router = express.Router();

    router.get(
      "/file-output/:fileReferenceId",
      async (req: express.Request, res: express.Response) => {
        const body = ZOutputRequest.parse(req.params);

        const [questions, summaries] = await Promise.all([
          this.questionStore.getForFile(body.fileReferenceId),
          this.summaryStore.getForFile(body.fileReferenceId),
        ]);
        res.json({ questions, summaries });
      }
    );

    router.get(
      "/chunk-output/:textChunkId",
      async (req: express.Request, res: express.Response) => {
        const body = ZChunkRequest.parse(req.params);

        const [questions, summaries] = await Promise.all([
          this.questionStore.getForChunk(body.textChunkId),
          this.summaryStore.getForChunk(body.textChunkId),
        ]);
        res.json({ questions, summaries });
      }
    );

    router.post(
      "/playground",
      async (req: express.Request, res: express.Response) => {
        const body = ZPlaygroundRequest.parse(req.body);

        const chunk = await this.chunkStore.getTextChunkById(body.textChunkId);

        const response = await this.mlService.playGround({
          text: chunk.chunkText,
          prompt: body.prompt,
        });

        res.json({ response });
      }
    );

    router.get(
      "/sample-file/:fileReferenceId",
      async (req: express.Request, res: express.Response) => {
        const body = ZSampleRequest.parse(req.params);

        const questions = await this.questionStore.sampleForFile(
          body.fileReferenceId,
          10
        );

        res.json({ questions });
      }
    );

    return router;
  }
}

const ZSampleRequest = z.object({
  fileReferenceId: z.string(),
});

const ZPlaygroundRequest = z.object({
  textChunkId: z.string(),
  prompt: z.string(),
});

const ZOutputRequest = z.object({ fileReferenceId: z.string() });
const ZChunkRequest = z.object({
  textChunkId: z.string(),
});

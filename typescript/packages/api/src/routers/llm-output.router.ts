import {
  MLServiceClient,
  QuestionStore,
  ReportService,
  TextChunkStore,
} from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class LLMOutputRouter {
  constructor(
    private readonly questionStore: QuestionStore,
    private readonly mlService: MLServiceClient,
    private readonly chunkStore: TextChunkStore,
    private readonly reportService: ReportService
  ) {}
  init() {
    const router = express.Router();

    router.get(
      "/chunk-output/:textChunkId",
      async (req: express.Request, res: express.Response) => {
        const body = ZChunkRequest.parse(req.params);

        const questions = await this.questionStore.getForChunk(
          body.textChunkId
        );
        res.json({ questions });
      }
    );

    router.post(
      "/gen-chunk-output",
      async (req: express.Request, res: express.Response) => {
        const body = ZGenChunkRequest.parse(req.body);

        const chunk = await this.chunkStore.getTextChunkById(body.textChunkId);

        const output = await this.mlService.llmOutput({
          text: chunk.chunkText,
        });

        res.json({ output });
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
          jsonSchema: body.jsonSchema,
          functionName: body.functionName,
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

    router.get(
      "/report/:fileReferenceId",
      async (req: express.Request, res: express.Response) => {
        const body = ZSampleRequest.parse(req.params);
        const report = await this.reportService.forFileReferenceId(
          body.fileReferenceId
        );

        res.json({ report });
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
  functionName: z.string(),
  jsonSchema: z.record(z.any()),
});

const ZChunkRequest = z.object({
  textChunkId: z.string(),
});

const ZGenChunkRequest = z.object({
  textChunkId: z.string(),
});

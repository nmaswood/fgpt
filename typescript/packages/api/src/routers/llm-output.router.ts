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
        const body = ZSampleFileRequest.parse(req.params);

        const questions = await this.questionStore.sampleForFile(
          body.fileReferenceId,
          10
        );

        res.json({ questions });
      }
    );

    router.get(
      "/sample-project/:projectId",
      async (req: express.Request, res: express.Response) => {
        const body = ZSampleProjectRequest.parse(req.params);

        const questions = await this.questionStore.sampleForProject(
          body.projectId,
          10
        );

        res.json({ questions });
      }
    );

    router.get(
      "/report/:fileReferenceId",
      async (req: express.Request, res: express.Response) => {
        const body = ZSampleFileRequest.parse(req.params);
        const [report, textChunkGroup] = await Promise.all([
          this.reportService.forFileReferenceId(body.fileReferenceId),
          this.chunkStore.getTextChunkGroupByStrategy(
            body.fileReferenceId,
            "greedy_15k"
          ),
        ]);

        const progress = textChunkGroup
          ? await this.chunkStore.getLlmOutputProgress(textChunkGroup.id)
          : undefined;

        res.json({ report, progress });
      }
    );

    return router;
  }
}
const ZSampleProjectRequest = z.object({
  projectId: z.string(),
});

const ZSampleFileRequest = z.object({
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

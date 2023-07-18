import { FileRenderService, QuestionStore } from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class LLMOutputRouter {
  constructor(
    private readonly questionStore: QuestionStore,
    private readonly fileToRenderService: FileRenderService,
  ) {}
  init() {
    const router = express.Router();

    router.get(
      "/chunk-output/:textChunkId",
      async (req: express.Request, res: express.Response) => {
        const body = ZChunkRequest.parse(req.params);

        const questions = await this.questionStore.getForChunk(
          body.textChunkId,
        );
        res.json({ questions });
      },
    );

    router.get(
      "/sample-file/:fileReferenceId",
      async (req: express.Request, res: express.Response) => {
        const body = ZSampleFileRequest.parse(req.params);

        const questions = await this.questionStore.sampleForFile(
          body.fileReferenceId,
          10,
        );

        res.json({ questions });
      },
    );

    router.get(
      "/sample-project/:projectId",
      async (req: express.Request, res: express.Response) => {
        const body = ZSampleProjectRequest.parse(req.params);

        const questions = await this.questionStore.sampleForProject(
          body.projectId,
          10,
        );

        res.json({ questions });
      },
    );

    router.get(
      "/render-file/:fileReferenceId",
      async (req: express.Request, res: express.Response) => {
        const body = ZFileToRenderRequest.parse(req.params);
        const file = await this.fileToRenderService.forFile(
          body.fileReferenceId,
        );

        res.json({ file });
      },
    );

    return router;
  }
}
const ZSampleProjectRequest = z.object({
  projectId: z.string(),
});

const ZFileToRenderRequest = z.object({
  fileReferenceId: z.string(),
});

const ZSampleFileRequest = z.object({
  fileReferenceId: z.string(),
});

const ZChunkRequest = z.object({
  textChunkId: z.string(),
});

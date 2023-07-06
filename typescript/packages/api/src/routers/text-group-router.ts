import { ZChunkStrategy } from "@fgpt/precedent-iso";
import { TextChunkStore } from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class TextGroupRouter {
  constructor(private readonly textChunkStore: TextChunkStore) {}
  init() {
    const router = express.Router();

    router.get(
      "/text-group/:chunkStrategy/:fileId",
      async (req: express.Request, res: express.Response) => {
        const body = ZTextChunkRequest.parse(req.params);

        const textGroup = await this.textChunkStore.getTextChunkGroupByFileId(
          body.chunkStrategy,
          body.fileId,
        );
        res.json({ textGroup });
      },
    );

    router.post(
      "/text-group-chunk",
      async (req: express.Request, res: express.Response) => {
        const params = ZTextGroupChunkRequest.parse(req.body);
        const chunk = await this.textChunkStore.getTextChunkByOrder(
          params.textGroupId,
          params.order,
        );

        res.json({ textGroup: chunk });
      },
    );

    return router;
  }
}

const ZTextChunkRequest = z.object({
  fileId: z.string(),
  chunkStrategy: ZChunkStrategy,
});

const ZTextGroupChunkRequest = z.object({
  textGroupId: z.string(),
  order: z.number().min(0).max(100_000_000),
});

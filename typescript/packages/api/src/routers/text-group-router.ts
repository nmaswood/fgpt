import { TextChunkStore } from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class TextGroupRouter {
  constructor(private readonly textChunkStore: TextChunkStore) {}
  init() {
    const router = express.Router();

    router.get(
      "/text-group/:fileId",
      async (req: express.Request, res: express.Response) => {
        const fileId = req.params.fileId;
        if (typeof fileId !== "string") {
          throw new Error("invalid request");
        }

        const textGroup = await this.textChunkStore.getTextChunkGroupByFileId(
          fileId
        );

        res.json({ textGroup });
      }
    );

    router.post(
      "/text-group-chunk",
      async (req: express.Request, res: express.Response) => {
        const params = ZTextGroupChunkRequest.parse(req.body);
        const chunk = await this.textChunkStore.getTextChunk(
          params.textGroupId,
          params.order
        );

        res.json({ textGroup: chunk });
      }
    );

    return router;
  }
}

const ZTextGroupChunkRequest = z.object({
  textGroupId: z.string(),
  order: z.number().min(0).max(100_000_000),
});

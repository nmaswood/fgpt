import { FileReferenceStore } from "@fgpt/precedent-node";
import express from "express";

export class FileRouter {
  constructor(private readonly fileReferenceStore: FileReferenceStore) {}
  init() {
    const router = express.Router();

    router.get("/list", async (req: express.Request, res: express.Response) => {
      // TODO Permissions here
      const files = await this.fileReferenceStore.list(req.user.organizationId);
      res.json({ files });
    });

    router.post("/upload", async (_: express.Request, __: express.Response) => {
      throw new Error("Not implemented");
    });

    return router;
  }
}

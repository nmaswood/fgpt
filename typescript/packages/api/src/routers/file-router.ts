import { FileReferenceStore } from "@fgpt/precedent-node";
import express from "express";

export class FileRouter {
  constructor(private readonly fileReferenceStore: FileReferenceStore) {}
  init() {
    const router = express.Router();

    router.get(
      "/list/:projectId",
      async (req: express.Request, res: express.Response) => {
        const projectId = req.params.projectId;
        if (typeof projectId !== "string") {
          throw new Error("invalid request");
        }

        const files = await this.fileReferenceStore.list(projectId);
        res.json({ files });
      }
    );

    router.post("/upload", async (_: express.Request, __: express.Response) => {
      console.log("FUCK");
      throw new Error("Not implemented");
    });

    return router;
  }
}

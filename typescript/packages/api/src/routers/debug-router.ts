import { FileReferenceStore, TaskStore } from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class DebugRouter {
  constructor(
    private readonly taskService: TaskStore,
    private readonly fileReferenceStore: FileReferenceStore
  ) {}
  init() {
    const router = express.Router();

    router.get(
      "/gen-excel-task/:fileReferenceId",
      async (req: express.Request, res: express.Response) => {
        const args = ZGenExcelArgs.parse(req.params);
        const file = await this.fileReferenceStore.get(args.fileReferenceId);
        const task = await this.taskService.insert({
          organizationId: file.organizationId,
          projectId: file.projectId,
          config: {
            type: "extract-table",
            version: "1",
            organizationId: file.organizationId,
            projectId: file.projectId,
            fileReferenceId: file.id,
          },
        });

        res.json({ task });
      }
    );

    return router;
  }
}

const ZGenExcelArgs = z.object({
  fileReferenceId: z.string(),
});

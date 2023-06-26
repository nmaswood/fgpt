import {
  FileReferenceStore,
  MessageBusService,
  TaskStore,
} from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class DebugRouter {
  constructor(
    private readonly taskService: TaskStore,
    private readonly fileReferenceStore: FileReferenceStore,
    private readonly messageBusService: MessageBusService
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
          fileReferenceId: file.id,
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

    router.get(
      "/queue/:taskId",
      async (req: express.Request, res: express.Response) => {
        const { taskId } = ZQueueArgs.parse(req.params);
        await this.messageBusService.enqueue({
          type: "task",
          taskId,
        });

        res.send("OK");
      }
    );

    return router;
  }
}
const ZQueueArgs = z.object({
  taskId: z.string(),
});

const ZGenExcelArgs = z.object({
  fileReferenceId: z.string(),
});

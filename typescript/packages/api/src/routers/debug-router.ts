import { MessageBusService } from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class DebugRouter {
  constructor(private readonly messageBusService: MessageBusService) {}
  init() {
    const router = express.Router();

    router.get(
      "/queue/:taskId",
      async (req: express.Request, res: express.Response) => {
        const { taskId } = ZQueueArgs.parse(req.params);
        await this.messageBusService.enqueue({
          type: "task",
          taskId,
        });

        res.send("OK");
      },
    );

    return router;
  }
}
const ZQueueArgs = z.object({
  taskId: z.string(),
});

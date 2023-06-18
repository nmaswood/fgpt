import { LOGGER, TaskExecutor, TaskStore } from "@fgpt/precedent-node";
import { ZMessage } from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class MainRouter {
  constructor(
    private readonly taskStore: TaskStore,
    private readonly taskExecutor: TaskExecutor
  ) {}
  init() {
    const router = express.Router();

    router.post("/", async (req: express.Request, res: express.Response) => {
      const rawMessage = req.body?.message;
      const parsed = ZRawMessage.safeParse(rawMessage);
      LOGGER.info({ rawMessage, parseSuccess: parsed.success });

      if (!parsed.success) {
        LOGGER.error("Could not parse message");
        res.status(204).send(`Bad Request: Could not parse object`);
        return;
      }

      const message = ZMessage.safeParse(JSON.parse(parsed.data.data));
      if (!message.success) {
        LOGGER.error("Could not parse message");
        res.status(204).send(`Bad Request: Could not parse object`);
        return;
      }
      const fullyParsed = message.data;
      LOGGER.info({ fullyParsed }, "Message parsed!");

      try {
        const task = await this.taskStore.get(fullyParsed.taskId);
        LOGGER.info({ task }, "Executing task");
        await this.taskExecutor.execute(task);
        await this.taskStore.setToSuceeded(task.id);
        LOGGER.info("completed task");
        res.status(204).send();
      } catch (e) {
        LOGGER.error("Could not execute task");
        LOGGER.error(e);

        await this.taskStore.setToFailed(fullyParsed.taskId);
        // TODO retry
        res.status(204).send();
      }
    });

    return router;
  }
}

const ZRawMessage = z
  .object({
    messageId: z.string().min(1),
    data: z.string().min(1),
  })
  .transform((row) => ({
    ...row,
    data: Buffer.from(row.data, "base64").toString().trim(),
  }));

import {
  LOGGER,
  Message,
  TaskExecutor,
  TaskStore,
  ZMessage,
} from "@fgpt/precedent-node";
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
      LOGGER.info("Main Route: Starting to process message");
      const rawMessage = req.body?.message;

      const message = tryParse(rawMessage);
      if (!message) {
        LOGGER.error("Could not parse message");
        res.status(204).send(`Bad Request: Could not parse object`);
        return;
      }

      LOGGER.info({ message }, "Message parsed!");

      try {
        await this.taskStore.setToInProgress(message.taskId);
        const task = await this.taskStore.get(message.taskId);
        LOGGER.info({ task }, "Executing task");
        await this.taskExecutor.execute(task);
        await this.taskStore.setToSuceeded(task.id);
        LOGGER.info({ taskId: task.id }, "completed task");
        res.status(204).send();
        return;
      } catch (e) {
        LOGGER.error("Could not execute task");
        LOGGER.error(e);

        await this.taskStore.setToFailed(message.taskId);
        // TODO retry
        res.status(204).send();

        return;
      }
    });

    router.post(
      "/dead-letter",
      async (req: express.Request, res: express.Response) => {
        LOGGER.info("Dead letter: Starting to process message");
        const rawMessage = req.body?.message;

        const message = tryParse(rawMessage);
        if (!message) {
          LOGGER.error("Could not parse message");
          res.status(204).send(`Bad Request: Could not parse object`);
          return;
        }

        LOGGER.info({ message }, "Message parsed!");
        try {
          const task = await this.taskStore.setToFailed(message.taskId);
          LOGGER.info({ task }, "Failed task");
          res.status(204).send();
          return;
        } catch (e) {
          LOGGER.error("Could not fail task");
          LOGGER.error("Could not fail task");
          res.status(204).send();
          return;
        }
      }
    );

    return router;
  }
}

function tryParse(rawMessage: unknown): Message | undefined {
  try {
    const message = ZRawMessage.parse(rawMessage);
    const asJson = JSON.parse(message.data);
    return ZMessage.parse(asJson);
  } catch (e) {
    LOGGER.error(e);
    LOGGER.error({ rawMessage }, "Could not parse message");
    return undefined;
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

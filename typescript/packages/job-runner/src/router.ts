import {
  LOGGER,
  TaskExecutor,
  TaskStore,
  ZMessage,
} from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class MainRouter {
  constructor(
    private readonly taskStore: TaskStore,
    private readonly taskExecutor: TaskExecutor,
  ) {}
  init() {
    const router = express.Router();

    router.post("/", async (req: express.Request, res: express.Response) => {
      LOGGER.info("Main Route: Starting to process message");
      const rawMessage = req.body?.message;

      const parsedMessage = tryParse(rawMessage);
      if (!parsedMessage) {
        LOGGER.error("Could not parse message");
        res.status(204).send(`Bad Request: Could not parse object`);
        return;
      }

      const { taskId, messageId } = parsedMessage;
      LOGGER.info({ taskId, messageId }, "Message parsed!");

      try {
        await this.taskStore.setToInProgress(taskId);
        const task = await this.taskStore.get(taskId);
        LOGGER.info(task.config, "Executing task");
        this.taskExecutor;
        await this.taskExecutor.execute(task);
        await this.taskStore.setToSuceeded(task.id);

        LOGGER.info({ taskId: task.id }, "completed task");
        res.status(204).send();
        LOGGER.info("Just sent a 204");
        return;
      } catch (e) {
        LOGGER.error("Could not execute task");
        LOGGER.error(e);

        await this.taskStore.setToFailed(taskId);

        res.status(500).send();

        return;
      }
    });

    router.post(
      "/dead-letter",
      async (req: express.Request, res: express.Response) => {
        LOGGER.info(
          { body: req.body },
          "Dead letter: Starting to process message",
        );
        const rawMessage = req.body?.message;

        const parsedMessage = tryParse(rawMessage);
        if (!parsedMessage) {
          LOGGER.error("Could not parse message");
          res.status(204).send(`Bad Request: Could not parse object`);
          return;
        }
        const { taskId, messageId } = parsedMessage;

        LOGGER.info({ taskId, messageId }, "Message parsed!");
        try {
          const task = await this.taskStore.setToFailed(taskId);
          LOGGER.info({ task }, "Failed task");
          res.status(204).send();
          return;
        } catch (e) {
          LOGGER.error("Could not fail task");
          LOGGER.error("Could not fail task");
          res.status(204).send();
          return;
        }
      },
    );

    return router;
  }
}

function tryParse(rawMessage: unknown) {
  try {
    const message = ZRawMessage.parse(rawMessage);
    const asJson = JSON.parse(message.data);
    return {
      taskId: ZMessage.parse(asJson).taskId,
      messageId: message.messageId,
    };
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

import { PubSub } from "@google-cloud/pubsub";
import { z } from "zod";

import { LOGGER } from "./logger";

export const ZMessage = z.object({
  type: z.literal("task"),
  taskId: z.string(),
});

export type Message = z.infer<typeof ZMessage>;

export interface MessageBusService {
  enqueue(message: Message): Promise<string>;
}

export class PubsubMessageBusService implements MessageBusService {
  #client: PubSub;
  constructor(
    projectId: string,
    private readonly topic: string,
    emulatorHost: string | undefined,
  ) {
    this.#client = new PubSub({
      projectId,
      ...(emulatorHost ? { apiEndpoint: emulatorHost } : {}),
    });
  }

  async enqueue(message: Message): Promise<string> {
    LOGGER.info(`Enqueuing message ${this.topic}:${message.taskId}`);
    const data = Buffer.from(JSON.stringify(message));
    const messageId = await this.#client
      .topic(this.topic)
      .publishMessage({ data });

    return messageId;
  }
}

export class NoopMessageBusService implements MessageBusService {
  async enqueue(m: Message): Promise<string> {
    return m.taskId;
  }
}
export const NOOP_MESSAGE_BUS_SERVICE = new NoopMessageBusService();

import { PubSub } from "@google-cloud/pubsub";

interface Message {
  type: "task";
  taskId: string;
}

export interface MessageBusService {
  enqueue(message: Message): Promise<string>;
}

export class PubsubMessageBusService implements MessageBusService {
  #client: PubSub;
  constructor(
    projectId: string,
    private readonly topic: string,
    emulatorHost: string | undefined
  ) {
    this.#client = new PubSub({
      projectId,
      ...(emulatorHost ? { apiEndpoint: emulatorHost } : {}),
    });
  }

  async enqueue(message: Message): Promise<string> {
    const data = Buffer.from(JSON.stringify(message));

    const messageId = await this.#client
      .topic(this.topic)
      .publishMessage({ data: data });

    return messageId;
  }
}

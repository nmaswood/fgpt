import * as dotenv from "dotenv";

dotenv.config();
import { isNotNull } from "@fgpt/precedent-iso";
import {
  dataBasePool,
  PSqlTaskStore,
  PubsubMessageBusService,
  TaskRunnerImpl,
} from "@fgpt/precedent-node";

import { getExecutor } from "./executor";
import { LOGGER } from "./logger";
import { SETTINGS, Settings } from "./settings";

LOGGER.info("Starting job runner...");

async function start(settings: Settings) {
  const pool = await dataBasePool(settings.sql.uri);
  const executor = await getExecutor(settings, pool);

  const messageBusService = new PubsubMessageBusService(
    settings.pubsub.projectId,
    settings.pubsub.topic,
    settings.pubsub.emulatorHost
  );

  const taskService = new PSqlTaskStore(pool, messageBusService);

  const runner = new TaskRunnerImpl(taskService, executor);

  LOGGER.info("Running executor...");
  LOGGER.info(SETTINGS);

  const results = await runner.run({
    limit: 1_000,
    retryLimit: 3,
    debugMode: SETTINGS.debugMode,
  });
  const erroredTaskIds = results
    .filter((r) => r.status === "failed")
    .map((r) => r.taskId)
    .filter(isNotNull);

  if (erroredTaskIds.length) {
    LOGGER.error({ erroredTaskIds }, "Some tasks failed");
    throw new Error("some tasks failed");
  }
}

start(SETTINGS);

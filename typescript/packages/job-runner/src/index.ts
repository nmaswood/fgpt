import * as dotenv from "dotenv";

dotenv.config();
import { isNotNull } from "@fgpt/precedent-iso";
import {
  dataBasePool,
  PSqlTaskService,
  TaskRunnerImpl,
} from "@fgpt/precedent-node";

import { getExecutor } from "./executor";
import { LOGGER } from "./logger";
import { COMMON_SETTINGS, CommonSettings } from "./settings";

LOGGER.info("Starting job runner...");

async function start(settings: CommonSettings) {
  const pool = await dataBasePool(settings.sql.uri);
  const executor = await getExecutor(settings, pool);

  const taskService = new PSqlTaskService(pool);

  const runner = new TaskRunnerImpl(taskService, executor);

  LOGGER.info("Running executor...");
  LOGGER.info(COMMON_SETTINGS);

  const results = await runner.run({
    limit: 1_000,
    retryLimit: 3,
    debugMode: COMMON_SETTINGS.debugMode,
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

start(COMMON_SETTINGS);

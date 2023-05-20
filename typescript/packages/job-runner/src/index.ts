import * as dotenv from "dotenv";

dotenv.config();
import {
  CloudVisionTextExtractor,
  dataBasePool,
  JobExecutorImpl,
  PsqlFileReferenceStore,
  PsqlProcessedFileStore,
  PSqlTaskService,
} from "@fgpt/precedent-node";

import { LOGGER } from "./logger";
import { SETTINGS, Settings } from "./settings";

LOGGER.info("Starting job runner...");

async function start(settings: Settings) {
  const pool = await dataBasePool(settings.sql.uri);

  const fileReferenceStore = new PsqlFileReferenceStore(pool);
  const textExtractor = new CloudVisionTextExtractor(
    fileReferenceStore,
    settings.assetBucket
  );
  const taskService = new PSqlTaskService(pool);

  const processedFileStore = new PsqlProcessedFileStore(pool);

  const executor = new JobExecutorImpl(
    textExtractor,
    taskService,
    processedFileStore
  );

  LOGGER.info("Running executor...");
  await executor.run({
    limit: 1_000,
    retryLimit: 3,
  });
}

start(SETTINGS);

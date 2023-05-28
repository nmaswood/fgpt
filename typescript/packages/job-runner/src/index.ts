import * as dotenv from "dotenv";

dotenv.config();
import {
  CloudVisionTextExtractor,
  dataBasePool,
  GoogleCloudStorageService,
  JobExecutorImpl,
  MLServiceClientImpl,
  PsqlFileReferenceStore,
  PsqlProcessedFileStore,
  PSqlTaskService,
  PsqlTextChunkStore,
  TikaHttpClient,
} from "@fgpt/precedent-node";

import { LOGGER } from "./logger";
import { SETTINGS, Settings } from "./settings";

LOGGER.info("Starting job runner...");

async function start(settings: Settings) {
  const pool = await dataBasePool(settings.sql.uri);

  const fileReferenceStore = new PsqlFileReferenceStore(pool);
  const blobStorageService = new GoogleCloudStorageService();
  const tikaClient = new TikaHttpClient(settings.tikaClient);
  const textExtractor = new CloudVisionTextExtractor(
    fileReferenceStore,
    settings.assetBucket,
    blobStorageService,
    tikaClient
  );
  const taskService = new PSqlTaskService(pool);

  const processedFileStore = new PsqlProcessedFileStore(pool);

  const textChunkStore = new PsqlTextChunkStore(pool);

  const mlServiceClient = new MLServiceClientImpl(settings.mlServiceUri);

  const executor = new JobExecutorImpl(
    textExtractor,
    taskService,
    processedFileStore,
    textChunkStore,
    mlServiceClient
  );

  LOGGER.info("Running executor...");
  await executor.run({
    limit: 1_000,
    retryLimit: 3,
  });
}

start(SETTINGS);

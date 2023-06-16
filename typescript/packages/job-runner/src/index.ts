import * as dotenv from "dotenv";

dotenv.config();
import { isNotNull } from "@fgpt/precedent-iso";
import {
  AnalyisServiceImpl,
  dataBasePool,
  GoogleCloudStorageService,
  JobExecutorImpl,
  MLServiceClientImpl,
  PsqlAnalysisStore,
  PsqlFileReferenceStore,
  PsqlMiscOutputStore,
  PsqlProcessedFileStore,
  PsqlQuestionStore,
  PSqlTaskService,
  PsqlTextChunkStore,
  TikaHttpClient,
  TikaTextExtractor,
} from "@fgpt/precedent-node";

import { LOGGER } from "./logger";
import { SETTINGS, Settings } from "./settings";

LOGGER.info("Starting job runner...");

async function start(settings: Settings) {
  const pool = await dataBasePool(settings.sql.uri);

  const fileReferenceStore = new PsqlFileReferenceStore(pool);
  const blobStorageService = new GoogleCloudStorageService();
  const tikaClient = new TikaHttpClient(settings.tikaClient);
  const textExtractor = new TikaTextExtractor(
    fileReferenceStore,
    settings.assetBucket,
    blobStorageService,
    tikaClient
  );
  const taskService = new PSqlTaskService(pool);

  const processedFileStore = new PsqlProcessedFileStore(pool);

  const textChunkStore = new PsqlTextChunkStore(pool);

  const mlServiceClient = new MLServiceClientImpl(settings.mlServiceUri);

  const analysisStore = new PsqlAnalysisStore(pool);
  const analysisService = new AnalyisServiceImpl(
    analysisStore,
    mlServiceClient,
    textChunkStore
  );

  const questionStore = new PsqlQuestionStore(pool);
  const metricsStore = new PsqlMiscOutputStore(pool);

  const executor = new JobExecutorImpl(
    textExtractor,
    taskService,
    processedFileStore,
    textChunkStore,
    mlServiceClient,
    analysisService,
    analysisStore,
    questionStore,
    metricsStore
  );

  LOGGER.info("Running executor...");
  LOGGER.info(SETTINGS);

  const results = await executor.run({
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

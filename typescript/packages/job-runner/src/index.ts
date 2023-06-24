import * as dotenv from "dotenv";

dotenv.config();
import "express-async-errors"; // eslint-disable-line

import express from "express";

import { LOGGER } from "./logger";

import {
  dataBasePool,
  GoogleCloudStorageService,
  MLServiceClientImpl,
  PsqlFileReferenceStore,
  PsqlMiscOutputStore,
  PsqlProcessedFileStore,
  PsqlQuestionStore,
  PSqlTaskStore,
  PsqlTextChunkStore,
  PubsubMessageBusService,
  TikaHttpClient,
  TikaTextExtractor,
  TaskExecutorImpl,
  HttpTableExtractor,
} from "@fgpt/precedent-node";
import { SETTINGS, Settings } from "./settings";
import { MainRouter } from "./router";

LOGGER.info("Server starting...");

async function start(settings: Settings) {
  const app = express();

  app.use(express.json());

  app.enable("trust proxy");

  app.get("/ping", (_, res) => {
    res.json({ ping: "pong" });
  });

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

  const messageBusService = new PubsubMessageBusService(
    settings.pubsub.projectId,
    settings.pubsub.topic,
    settings.pubsub.emulatorHost
  );

  const taskService = new PSqlTaskStore(pool, messageBusService);

  const processedFileStore = new PsqlProcessedFileStore(pool);

  const textChunkStore = new PsqlTextChunkStore(pool);

  const mlServiceClient = new MLServiceClientImpl(settings.mlServiceUri);

  const questionStore = new PsqlQuestionStore(pool);
  const metricsStore = new PsqlMiscOutputStore(pool);

  const tableExtractor = new HttpTableExtractor(settings.mlServiceUri);

  const taskExecutor = new TaskExecutorImpl(
    textExtractor,
    taskService,
    processedFileStore,
    textChunkStore,
    mlServiceClient,
    questionStore,
    metricsStore,
    fileReferenceStore,
    tableExtractor
  );

  const taskStore = new PSqlTaskStore(pool, messageBusService);

  const mainRouter = new MainRouter(taskStore, taskExecutor);

  app.use("/", mainRouter.init());

  app.listen(settings.port, settings.host);
}

start(SETTINGS);

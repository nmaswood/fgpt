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
  HttpTabularDataService,
  TextExtractionHandlerImpl,
  PsqlExcelAssetStore,
  PsqlExcelOutputStore,
  TextChunkHandlerImpl,
  EmbeddingsHandlerImpl,
  ReportHandlerImpl,
  TableHandlerImpl,
  IngestFileHandlerImpl,
  axiosClientForMlService,
  PineconeVectorService,
  MLReportServiceImpl,
} from "@fgpt/precedent-node";
import { SETTINGS, Settings } from "./settings";
import { MainRouter } from "./router";

LOGGER.info("Server starting...");

async function start(settings: Settings) {
  const app = express();

  app.use(express.json());

  app.enable("trust proxy");

  const pool = await dataBasePool(settings.sql.uri);
  const fileReferenceStore = new PsqlFileReferenceStore(pool);
  const blobStorageService = new GoogleCloudStorageService();
  const tikaClient = new TikaHttpClient(settings.tikaClient);
  const textExtractor = new TikaTextExtractor(
    fileReferenceStore,
    settings.assetBucket,
    blobStorageService,
    tikaClient,
  );

  const messageBusService = new PubsubMessageBusService(
    settings.pubsub.projectId,
    settings.pubsub.topic,
    settings.pubsub.emulatorHost,
  );

  const taskService = new PSqlTaskStore(pool, messageBusService);

  const processedFileStore = new PsqlProcessedFileStore(pool);

  const textChunkStore = new PsqlTextChunkStore(pool);

  const springtimeClient = axiosClientForMlService({
    baseURL: SETTINGS.mlServiceUri,
    serviceToServiceSecret: SETTINGS.serviceToServiceSecret,
  });

  const vectorService = new PineconeVectorService(springtimeClient);
  const mlServiceClient = new MLServiceClientImpl(springtimeClient);
  const mlReportService = new MLReportServiceImpl(springtimeClient);

  const questionStore = new PsqlQuestionStore(pool);
  const miscOutputStore = new PsqlMiscOutputStore(pool);

  const tabularDataService = new HttpTabularDataService(springtimeClient);

  const excelAssetStore = new PsqlExcelAssetStore(pool);
  const excelOutputStore = new PsqlExcelOutputStore(pool);

  const textExtractionHandler = new TextExtractionHandlerImpl(
    textExtractor,
    processedFileStore,
    mlServiceClient,
  );

  const textChunkHandler = new TextChunkHandlerImpl(
    processedFileStore,
    textChunkStore,
  );

  const generateEmbeddingsHandler = new EmbeddingsHandlerImpl(
    mlServiceClient,
    textChunkStore,
    vectorService,
  );
  const reportHandler = new ReportHandlerImpl(
    mlReportService,
    textChunkStore,
    questionStore,
    miscOutputStore,
  );

  const tableHandler = new TableHandlerImpl(
    fileReferenceStore,
    tabularDataService,
    excelAssetStore,
    excelOutputStore,
  );

  const taskStore = new PSqlTaskStore(pool, messageBusService);

  const ingestFileHandler = new IngestFileHandlerImpl(taskStore);

  const taskExecutor = new TaskExecutorImpl(
    taskService,
    textExtractionHandler,
    textChunkHandler,
    generateEmbeddingsHandler,
    reportHandler,
    tableHandler,
    ingestFileHandler,
    SETTINGS.claudeReportGeneration,
  );

  const mainRouter = new MainRouter(taskStore, taskExecutor);

  app.use("/", mainRouter.init());

  app.get("/ping", (_, res) => {
    res.send("pong");
  });

  app.use("/healthz", (_, res) => {
    res.send("OK");
  });

  const server = app.listen(settings.port, settings.host);
  process.on("SIGTERM", () => {
    LOGGER.info("SIGTERM signal received. Closing HTTP Server");
    server.close(() => {
      LOGGER.info("Http server closed.");
      process.exit(0);
    });
  });
}

start(SETTINGS);

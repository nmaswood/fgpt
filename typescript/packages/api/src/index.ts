import * as dotenv from "dotenv";

dotenv.config();
// eslint-disable-next-line simple-import-sort/imports
import { SETTINGS } from "./settings";

import * as profiler from "@google-cloud/profiler";
import * as tracer from "@google-cloud/trace-agent";

import "express-async-errors"; // eslint-disable-line
if (SETTINGS.tracingEnabled) {
  profiler.start({
    serviceContext: {
      service: "api",
      version: "1.0.0",
    },
  });
  tracer.start();
}

import {
  axiosClientForMlService,
  ExcelProgressServiceImpl,
  FileStatusServiceImpl,
  FileToRenderServiceImpl,
  GoogleCloudStorageService,
  MLServiceClientImpl,
  PineconeVectorService,
  ProcessedFileProgressServiceImpl,
  PsqlChatStore,
  PsqlExcelAssetStore,
  PsqlExcelOutputStore,
  PsqlFileReferenceStore,
  PsqlLoadedFileStore,
  PsqlMiscOutputStore,
  PSqlProjectStore,
  PsqlQuestionStore,
  PsqlShowCaseFileStore,
  PSqlTaskStore,
  PsqlTextChunkStore,
  PsqlUserOrgService,
  PubsubMessageBusService,
  RenderShowCaseFileServiceImpl,
  ReportServiceImpl,
} from "@fgpt/precedent-node";
import cors from "cors";
import express from "express";
import { expressjwt } from "express-jwt";
import helmet from "helmet";
import { expressJwtSecret } from "jwks-rsa";

import { LOGGER } from "./logger";
import { ensureAdmin } from "./middleware/admin-middleware";
import { errorLogger } from "./middleware/error-logger";
import { errorResponder } from "./middleware/error-responder";
import { invalidPathHandler } from "./middleware/invalid-path-handler";
import { UserInformationMiddleware } from "./middleware/user-information-middleware";
import { AdminRouter } from "./routers/admin-router";
import { ChatRouter } from "./routers/chat-router";
import { DebugRouter } from "./routers/debug-router";
import { FileRouter } from "./routers/file-router";
import { LLMOutputRouter } from "./routers/llm-output.router";
import { ProjectRouter } from "./routers/project-router";
import { UserOrgRouter } from "./routers/user-org-router";
import { dataBasePool } from "./sql";

LOGGER.info("Server starting ...");

const jwtCheck = expressjwt({
  secret: expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: SETTINGS.auth.jwksUri,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any,

  issuer: SETTINGS.auth.issuer,
  audience: SETTINGS.auth.audience,
  algorithms: ["RS256"],
});

async function start() {
  const app = express();
  app.enable("trust proxy");
  app.use(helmet());
  app.disable("x-powered-by");

  app.use(
    express.json({
      verify: function (req, _, buf) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).rawBody = buf;
      },
    }),
  );

  const pool = await dataBasePool(SETTINGS.sql.uri);

  const userOrgService = new PsqlUserOrgService(pool);

  const userMiddleware = new UserInformationMiddleware(userOrgService);

  const addUser = userMiddleware.addUser();
  const projectStore = new PSqlProjectStore(pool);

  const fileReferenceStore = new PsqlFileReferenceStore(pool);
  const loadedFileStore = new PsqlLoadedFileStore(pool);
  const objectStoreService = new GoogleCloudStorageService(
    SETTINGS.urlSigningServiceAccountPath,
  );
  const excelAssetStore = new PsqlExcelAssetStore(pool);
  const excelOutputStore = new PsqlExcelOutputStore(pool);

  const messageBusService = new PubsubMessageBusService(
    SETTINGS.pubsub.projectId,
    SETTINGS.pubsub.topic,
    SETTINGS.pubsub.emulatorHost,
  );

  const taskStore = new PSqlTaskStore(pool, messageBusService);

  const textChunkStore = new PsqlTextChunkStore(pool);

  const axiosClient = axiosClientForMlService({
    baseURL: SETTINGS.mlServiceUri,
    serviceToServiceSecret: SETTINGS.serviceToServiceSecret,
  });

  const mlService = new MLServiceClientImpl(axiosClient);

  // hack to wake up ml service
  // when api request is made
  mlService.ping().catch(() => console.log("ML service is down"));

  const vectorService = new PineconeVectorService(axiosClient);

  const chatStore = new PsqlChatStore(pool);

  const questionStore = new PsqlQuestionStore(pool);
  const miscOutputStore = new PsqlMiscOutputStore(pool);
  const reportService = new ReportServiceImpl(questionStore, miscOutputStore);
  const processedFileProgressStore = new ProcessedFileProgressServiceImpl(
    taskStore,
  );

  const excelProgressStore = new ExcelProgressServiceImpl(taskStore);
  const showCaseFileStore = new PsqlShowCaseFileStore(pool);

  const fileRenderService = new FileToRenderServiceImpl(
    fileReferenceStore,
    reportService,
    objectStoreService,
    excelOutputStore,
    excelAssetStore,
    projectStore,
  );
  const renderShowCaseFileService = new RenderShowCaseFileServiceImpl(
    showCaseFileStore,
    objectStoreService,
    fileReferenceStore,
    miscOutputStore,
    SETTINGS.assetBucket,
  );

  const fileStatusUpdater = new FileStatusServiceImpl(
    fileReferenceStore,
    processedFileProgressStore,
    excelProgressStore,
    SETTINGS.claudeReportGeneration,
  );

  app.use(cors({ origin: SETTINGS.corsOrigin }));

  app.use("/api/v1/user-org", jwtCheck, addUser, new UserOrgRouter().init());

  app.use(
    "/api/v1/projects",
    jwtCheck,
    addUser,
    new ProjectRouter(projectStore, userOrgService).init(),
  );

  app.use(
    "/api/v1/files",
    jwtCheck,
    addUser,
    new FileRouter(
      fileReferenceStore,
      objectStoreService,
      SETTINGS.assetBucket,
      taskStore,
      loadedFileStore,
      projectStore,
      showCaseFileStore,
      renderShowCaseFileService,
      fileStatusUpdater,
    ).init(),
  );

  app.use(
    "/api/v1/chat",
    jwtCheck,
    addUser,
    new ChatRouter(
      mlService,
      textChunkStore,
      chatStore,
      projectStore,
      fileReferenceStore,
      vectorService,
    ).init(),
  );

  app.use(
    "/api/v1/output",
    jwtCheck,
    addUser,
    new LLMOutputRouter(questionStore, fileRenderService).init(),
  );

  if (SETTINGS.debug.includeRouter) {
    app.use("/api/v1/debug", new DebugRouter(messageBusService).init());
  }
  app.use(
    "/api/v1/admin",
    jwtCheck,
    addUser,
    ensureAdmin,
    new AdminRouter(userOrgService).init(),
  );

  app.use("/ping", (_, res) => {
    res.json({ ping: "pong" });
  });
  app.use("/healthz", (_, res) => {
    res.send("OK");
  });
  app.use("/ping-ml", async (_, res) => {
    await mlService.ping();
    res.send("OK");
  });

  app.use(errorLogger);
  app.use(errorResponder);
  app.use(invalidPathHandler);

  const server = app.listen(SETTINGS.port, SETTINGS.host);
  process.on("SIGTERM", () => {
    LOGGER.info("SIGTERM signal received. Closing HTTP Server");
    server.close(() => {
      LOGGER.info("Http server closed.");
      process.exit(0);
    });
  });
}

start();

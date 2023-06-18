import * as dotenv from "dotenv";

dotenv.config();
import "express-async-errors"; // eslint-disable-line

import express from "express";

import { LOGGER } from "./logger";

import {
  dataBasePool,
  PSqlTaskStore,
  PubsubMessageBusService,
} from "@fgpt/precedent-node";
import { getExecutor } from "./executor";
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
  const taskExecutor = await getExecutor(settings, pool);
  const messageBusService = new PubsubMessageBusService(
    settings.pubsub.projectId,
    settings.pubsub.topic,
    settings.pubsub.emulatorHost
  );

  const taskStore = new PSqlTaskStore(pool, messageBusService);

  const mainRouter = new MainRouter(taskStore, taskExecutor);

  app.use("/", mainRouter.init());

  app.listen(settings.port, settings.host);
}

start(SETTINGS);

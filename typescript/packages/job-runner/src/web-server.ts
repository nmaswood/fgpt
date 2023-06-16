import * as dotenv from "dotenv";

dotenv.config();
import "express-async-errors"; // eslint-disable-line

import express from "express";

import { LOGGER } from "./logger";

import { WebServerSettings, WEB_SERVER_SETTINGS } from "./web-server-settings";

LOGGER.info("Server starting ...");

async function start({ port, host }: WebServerSettings) {
  const app = express();
  app.enable("trust proxy");

  app.use("/ping", (_, res) => {
    res.json({ ping: "pong" });
  });

  app.listen(port, host);
}

start(WEB_SERVER_SETTINGS);

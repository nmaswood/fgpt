import * as dotenv from "dotenv";

dotenv.config();
import "express-async-errors"; // eslint-disable-line

import { z } from "zod";

import express from "express";

import { LOGGER } from "./logger";

import { WebServerSettings, WEB_SERVER_SETTINGS } from "./web-server-settings";

LOGGER.info("Server starting...");

async function start({ port, host }: WebServerSettings) {
  const app = express();

  app.use(express.json());

  app.enable("trust proxy");

  app.get("/ping", (_, res) => {
    res.json({ ping: "pong" });
  });

  app.post("/", (req, res) => {
    const rawMessage = req.body?.message;
    const parsed = ZRawMessage.safeParse(rawMessage);
    LOGGER.info({ rawMessage, parseSuccess: parsed.success });

    if (!parsed.success) {
      LOGGER.error("Could not parse message");
      res.status(204).send(`Bad Request: Could not parse object`);
      return;
    }

    LOGGER.info({ parsed: parsed.data }, "Message parsed!");

    res.status(204).send();
  });

  app.listen(port, host);
}

start(WEB_SERVER_SETTINGS);

const ZRawMessage = z
  .object({
    messageId: z.string().min(1),
    data: z.string().min(1),
  })
  .transform((row) => ({
    ...row,
    data: Buffer.from(row.data, "base64").toString().trim(),
  }));

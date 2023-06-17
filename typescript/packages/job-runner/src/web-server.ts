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
    console.log({ parsed, rawMessage });

    if (!parsed.success) {
      const formatted = parsed.error.format();
      res.status(400).send(`Bad Request: ${formatted}`);
      return;
    }

    if (!rawMessage) {
      const msg = "no Pub/Sub message received";
      console.error(`error: ${msg}`);
      res.status(400).send(`Bad Request: ${msg}`);
      return;
    }

    res.status(204).send();
  });

  app.listen(port, host);
}

start(WEB_SERVER_SETTINGS);

const ZRawMessage = z
  .object({
    publishTime: z.string(),
    messageId: z.string().min(1),
    data: z.string().min(1),
  })
  .transform((row) => ({
    ...row,
    data: Buffer.from(row.data, "base64").toString().trim(),
  }));

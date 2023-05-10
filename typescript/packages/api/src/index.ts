import * as dotenv from "dotenv";

dotenv.config();
import "express-async-errors"; // eslint-disable-line

import cors from "cors";
import express from "express"; // eslint-disable-line

import { LOGGER } from "./logger";
import { errorLogger } from "./middleware/error-logger";
import { errorResponder } from "./middleware/error-responder";
import { invalidPathHandler } from "./middleware/invalid-path-handler";
import { SETTINGS } from "./settings";
import { dataBasePool } from "./sql";
import { TranscriptRouter } from "./routers/transcript-router";

import {
  PsqlTranscriptStore,
  MLServiceClientImpl,
  PsqlChunkPostSummaryStore,
} from "@fgpt/precedent-node";

LOGGER.info("Server starting ...");

async function start() {
  const app = express();
  app.enable("trust proxy");

  app.use(
    express.json({
      verify: function (req, _, buf) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).rawBody = buf;
      },
    })
  );

  const pool = await dataBasePool(SETTINGS.sql.uri);
  const transcriptStore = new PsqlTranscriptStore(pool);
  const mlService = new MLServiceClientImpl(SETTINGS.mlServiceUri);

  const chunkPostSummaryStore = new PsqlChunkPostSummaryStore(pool);

  app.use(cors({ origin: "*" }));

  app.use(
    "/api/v1/transcript",
    new TranscriptRouter(
      transcriptStore,
      mlService,
      chunkPostSummaryStore
    ).init()
  );

  app.use("/ping", (_, res) => {
    res.send("pong");
  });

  app.use(errorLogger);
  app.use(errorResponder);
  app.use(invalidPathHandler);

  app.listen(SETTINGS.port, SETTINGS.host);
}

start();

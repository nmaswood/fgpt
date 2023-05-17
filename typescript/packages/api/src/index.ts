import * as dotenv from "dotenv";

dotenv.config();
import "express-async-errors"; // eslint-disable-line

import cors from "cors";
import express from "express";
import { expressjwt } from "express-jwt";

import { expressJwtSecret } from "jwks-rsa";

import { LOGGER } from "./logger";
import { errorLogger } from "./middleware/error-logger";
import { errorResponder } from "./middleware/error-responder";
import { invalidPathHandler } from "./middleware/invalid-path-handler";
import { SETTINGS } from "./settings";
import { dataBasePool } from "./sql";

import {
  GoogleCloudStorageService,
  PsqlFileReferenceStore,
  PSqlProjectStore,
  PsqlUserOrgService,
} from "@fgpt/precedent-node";
import { UserInformationMiddleware } from "./middleware/user-information-middleware";
import { UserOrgRouter } from "./routers/user-org-router";
import { ProjectRouter } from "./routers/project-router";
import { FileRouter } from "./routers/file-router";

LOGGER.info("Server starting ...");

const jwtCheck = expressjwt({
  secret: expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: SETTINGS.auth.jwksUri,
  }) as any,

  issuer: SETTINGS.auth.issuer,
  audience: SETTINGS.auth.audience,
  algorithms: ["RS256"],
});

async function start() {
  const app = express();
  app.enable("trust proxy");

  app.use(
    express.json({
      limit: "50mb",
      verify: function (req, _, buf) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).rawBody = buf;
      },
    })
  );

  const pool = await dataBasePool(SETTINGS.sql.uri);

  const userOrgService = new PsqlUserOrgService(pool);

  const userMiddleware = new UserInformationMiddleware(userOrgService);

  const addUser = userMiddleware.addUser();
  const projectStore = new PSqlProjectStore(pool);

  const fileReferenceStore = new PsqlFileReferenceStore(pool);
  const blobStorageService = new GoogleCloudStorageService();

  app.use(cors({ origin: "*" }));

  app.use("/api/v1/user-org", jwtCheck, addUser, new UserOrgRouter().init());

  app.use(
    "/api/v1/projects",
    jwtCheck,
    addUser,
    new ProjectRouter(projectStore).init()
  );

  app.use(
    "/api/v1/files",
    jwtCheck,
    addUser,
    new FileRouter(
      fileReferenceStore,
      blobStorageService,
      SETTINGS.assetBucket
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

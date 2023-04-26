import type express from "express";

import { LOGGER } from "../logger";

export const errorLogger: express.ErrorRequestHandler = (err, _, __, next) => {
  LOGGER.error(err);
  next(err);
};

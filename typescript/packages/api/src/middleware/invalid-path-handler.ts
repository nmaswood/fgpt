import type express from "express";

export const invalidPathHandler = (
  _: express.Request,
  res: express.Response
) => {
  res.status(404);
  res.send("invalid path");
};

import type express from "express";

export const invalidPathHandler = (
  req: express.Request,
  res: express.Response,
) => {
  res.status(404);
  console.warn(`invalid path: ${req.path}`);
  res.send(`invalid path: ${req.path}`);
};

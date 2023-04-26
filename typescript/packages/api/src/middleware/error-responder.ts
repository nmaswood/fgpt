import type express from "express";

export const errorResponder: express.ErrorRequestHandler = (
  error,
  _req,
  response,
  _next // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
  const status = error.status || 400;
  response.status(status).json({ error: error.message });
};

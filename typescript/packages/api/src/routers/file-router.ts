import {} from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class FileRouter {
  constructor() {}

  init() {
    const router = express.Router();

    router.post(
      "/upload",
      async (req: express.Request, res: express.Response) => {
        //
      }
    );

    return router;
  }
}

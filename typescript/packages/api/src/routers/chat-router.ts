import express from "express";
import { z } from "zod";

export class ChatRouter {
  init() {
    const router = express.Router();

    router.post(
      "/chat",
      async (req: express.Request, res: express.Response) => {
        const user = req.user;
        const args = ZChatArguments.parse(req.body);
        console.log({ user, args });

        res.json({ status: "ok" });
      }
    );

    return router;
  }
}

const ZChatArguments = z.object({
  projectId: z.string(),
  question: z.string(),
});

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

        const chatResponse: ChatResponse = {
          answer: "dummy answer",
          context: [
            "dummy context",
            "dummy context",
            "dummy context",
            "dummy context",
            "dummy context",
            "dummy context",
            "dummy context",
            "dummy context",
            "dummy context",
          ],
        };

        res.json(chatResponse);
      }
    );

    return router;
  }
}

interface ChatResponse {
  answer: string;
  context: string[];
}

const ZChatArguments = z.object({
  projectId: z.string(),
  question: z.string(),
});

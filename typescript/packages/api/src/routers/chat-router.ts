import { MLServiceClient, TextChunkStore } from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class ChatRouter {
  constructor(
    private readonly mlClient: MLServiceClient,
    private readonly textChunkStore: TextChunkStore
  ) {}
  init() {
    const router = express.Router();

    router.post(
      "/chat",
      async (req: express.Request, res: express.Response) => {
        const args = ZChatArguments.parse(req.body);

        const vector = await this.mlClient.getEmbedding(args.question);

        const similarDocuments = await this.mlClient.getKSimilar({
          vector,
          metadata: { projectId: args.projectId },
        });

        const chunks = await this.textChunkStore.getTextChunks(
          similarDocuments
        );

        const justText = chunks.map((chunk) => chunk.chunkText);

        const answer = await this.mlClient.askQuestion({
          context: justText.join("\n"),
          question: args.question,
        });

        const chatResponse: ChatResponse = {
          answer: answer,
          context: justText,
        };
        console.log(
          {
            projectId: args.projectId,
            question: args.question,
            answer: answer,
            vector,
          },
          "Chat Response"
        );

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

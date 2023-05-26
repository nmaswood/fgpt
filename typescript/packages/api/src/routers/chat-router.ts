import { MLServiceClient, TextChunkStore } from "@fgpt/precedent-node";
import express from "express";
import { keyBy } from "lodash";
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
          similarDocuments.map((doc) => doc.id)
        );

        const byId = keyBy(chunks, (chunk) => chunk.id);

        const justText = chunks.map((chunk) => chunk.chunkText);

        const answer = await this.mlClient.askQuestion({
          context: justText.join("\n"),
          question: args.question,
        });

        const chatResponse: ChatResponse = {
          answer: answer,
          context: similarDocuments.map((doc) => ({
            text: byId[doc.id]!.chunkText,
            score: doc.score,
          })),
        };

        res.json(chatResponse);
      }
    );

    return router;
  }
}

interface ChatResponse {
  answer: string;
  context: ContextUnit[];
}

interface ContextUnit {
  score: number;
  text: string;
}

const ZChatArguments = z.object({
  projectId: z.string(),
  question: z.string(),
});

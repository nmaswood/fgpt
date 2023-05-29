import { isNotNull } from "@fgpt/precedent-iso";
import { MLServiceClient, TextChunkStore } from "@fgpt/precedent-node";
import express from "express";
import { keyBy } from "lodash";
import { z } from "zod";
//import { LOGGER } from "../logger";

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
        const projectId = req.query.projectId;
        const question = req.query.question;
        const args = ZChatArguments.parse({
          question,
          projectId,
        });

        const vector = await this.mlClient.getEmbedding(args.question);

        const similarDocuments = await this.mlClient.getKSimilar({
          vector,
          metadata: { projectId: args.projectId },
        });

        const chunks = await this.textChunkStore.getTextChunks(
          similarDocuments.map((doc) => doc.id)
        );

        const byId = keyBy(chunks, (chunk) => chunk.id);

        //for (const document of similarDocuments) {
        //if (!byId[document.id]) {
        //LOGGER.warn(
        //{ documentId: document.id },
        //"No document found for id"
        //);
        //}
        //}

        const justText = chunks.map((chunk) => chunk.chunkText);

        const context = similarDocuments
          .map(({ score, id }) => {
            const text = byId[id]?.chunkText;

            return text ? { score, text } : null;
          })
          .filter(isNotNull);
        context;

        await this.mlClient.askQuestion({
          context: justText.join("\n"),
          question: args.question,
          onData: (resp) => {
            res.write(resp);
          },
          onEnd: () => {
            res.end();
          },
        });
      }
    );

    return router;
  }
}

//interface ChatResponse {
//answer: string;
//context: ContextUnit[];
//}

//interface ContextUnit {
//score: number;
//text: string;
//}

const ZChatArguments = z.object({
  projectId: z.string(),
  question: z.string(),
});

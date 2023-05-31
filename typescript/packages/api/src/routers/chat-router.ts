import { ChatResponse } from "@fgpt/precedent-iso";
import {
  FileReferenceStore,
  MLServiceClient,
  TextChunkStore,
} from "@fgpt/precedent-node";
import express from "express";
import { keyBy } from "lodash";
import { z } from "zod";

import { LOGGER } from "../logger";

const encoder = new TextEncoder();

export class ChatRouter {
  constructor(
    private readonly mlClient: MLServiceClient,
    private readonly textChunkStore: TextChunkStore,
    private readonly fileReferenceStore: FileReferenceStore
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

        const missingIds = similarDocuments
          .map((doc) => doc.id)
          .filter((id) => !byId[id]);
        if (missingIds.length) {
          LOGGER.warn({ missingIds }, "No document found for id");
        }

        const justText = chunks.map((chunk) => chunk.chunkText);

        res.set("Content-Type", "text/event-stream");
        res.set("Cache-Control", "no-cache");
        res.set("Connection", "keep-alive");

        await this.mlClient.askQuestionStreaming({
          context: justText.join("\n"),
          question: args.question,
          onData: (resp) => {
            res.write(encoder.encode(resp));
          },
          onEnd: () => {
            res.end();
          },
        });
      }
    );

    router.post(
      "/debug",
      async (req: express.Request, res: express.Response) => {
        const args = ZChatArguments.parse(req.body);

        const vector = await this.mlClient.getEmbedding(args.question);

        const similarDocuments = await (async () => {
          const docs = await this.mlClient.getKSimilar({
            vector,
            metadata: { projectId: args.projectId },
          });

          return docs.map(({ id, score, metadata }) => ({
            id,
            score,
            metadata: ZVectorMetadata.parse(metadata),
          }));
        })();

        const filesById = keyBy(
          await this.fileReferenceStore.getMany(
            similarDocuments.map((doc) => doc.metadata.fileId)
          ),
          (file) => file.id
        );

        const chunks = await this.textChunkStore.getTextChunks(
          similarDocuments.map((doc) => doc.id)
        );

        const byId = keyBy(chunks, (chunk) => chunk.id);

        const missingIds = new Set(
          similarDocuments.map((doc) => doc.id).filter((id) => !byId[id])
        );

        if (missingIds.size > 0) {
          LOGGER.warn({ missingIds }, "No document found for id");
        }

        const response: ChatResponse[] = similarDocuments.map((doc) => ({
          filename: filesById[doc.metadata.fileId]?.fileName ?? "",
          score: doc.score,
          text: byId[doc.id]?.chunkText ?? "",
        }));

        res.json(response);
      }
    );

    return router;
  }
}

export const ZVectorMetadata = z.object({
  fileId: z.string(),
});

const ZChatArguments = z.object({
  projectId: z.string(),
  question: z.string(),
});

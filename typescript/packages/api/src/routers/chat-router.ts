import { ChatResponse } from "@fgpt/precedent-iso";
import {
  ChatStore,
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
    private readonly fileReferenceStore: FileReferenceStore,
    private readonly chatStore: ChatStore
  ) {}
  init() {
    const router = express.Router();

    router.get(
      "/list-chats/:projectId",
      async (req: express.Request, res: express.Response) => {
        const body = ZListChatRequest.parse(req.params);
        const chats = await this.chatStore.listChats(body.projectId);
        res.json({ chats });
      }
    );

    router.post(
      "/create-chat",
      async (req: express.Request, res: express.Response) => {
        const body = ZCreateChatRequest.parse(req.body);

        const chat = await this.chatStore.insertChat({
          organizationId: req.user.organizationId,
          projectId: body.projectId,
          creatorId: req.user.id,
          name: body.name,
        });

        res.json({ chat });
      }
    );

    router.delete(
      "/delete-chat/:chatId",
      async (req: express.Request, res: express.Response) => {
        const body = ZDeleteChatRequest.parse(req.params);
        await this.chatStore.deleteChat(body.chatId);
        res.json({ status: "ok" });
      }
    );

    router.get(
      "/chat-entry/:chatId",
      async (req: express.Request, res: express.Response) => {
        const body = ZGetChatEntryRequest.parse(req.params);

        const chatEntries = await this.chatStore.listChatEntries(body.chatId);

        res.json({ chatEntries });
      }
    );

    router.put("/chat", async (req: express.Request, res: express.Response) => {
      const args = ZEditChatRequest.parse(req.body);
      const chat = await this.chatStore.updateChat({
        chatId: args.id,
        name: args.name,
      });
      res.json({ chat });
    });

    router.post(
      "/chat",
      async (req: express.Request, res: express.Response) => {
        const args = ZChatArguments.parse(req.body);

        const vector = await this.mlClient.getEmbedding(args.question);

        const similarDocuments = await this.mlClient.getKSimilar({
          vector,
          metadata: { projectId: args.projectId },
        });

        const [chunks, history] = await Promise.all([
          this.textChunkStore.getTextChunks(
            similarDocuments.map((doc) => doc.id)
          ),
          this.chatStore.listChatHistory(args.chatId),
        ]);

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

        const buffer: string[] = [];

        const context = justText.join("\n");

        await this.mlClient.askQuestionStreaming({
          context,
          history,
          question: args.question,
          onData: (resp) => {
            const encoded = encoder.encode(resp);
            res.write(encoded);
            buffer.push(resp);
          },
          onEnd: async () => {
            res.end();
            await this.chatStore.insertChatEntry({
              organizationId: req.user.organizationId,
              projectId: args.projectId,
              creatorId: req.user.id,
              chatId: args.chatId,
              question: args.question,
              answer: buffer.join(""),
              context,
            });
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

const ZVectorMetadata = z.object({
  fileId: z.string(),
});

const ZEditChatRequest = z.object({
  id: z.string(),
  name: z.string(),
});

const ZChatArguments = z.object({
  projectId: z.string(),
  question: z.string(),
  chatId: z.string(),
});

const ZListChatRequest = z.object({ projectId: z.string() });

const ZGetChatEntryRequest = z.object({ chatId: z.string() });

const ZCreateChatRequest = z.object({
  projectId: z.string(),
  name: z.string(),
});

const ZDeleteChatRequest = z.object({
  chatId: z.string(),
});

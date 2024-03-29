import { assertNever } from "@fgpt/precedent-iso";
import {
  ChatContextService,
  ChatStore,
  FileReferenceStore,
  MLServiceClient,
  ProjectStore,
} from "@fgpt/precedent-node";
import { randomUUID } from "crypto";
import express from "express";
import { z } from "zod";

const encoder = new TextEncoder();

export class ChatRouter {
  constructor(
    private readonly mlClient: MLServiceClient,
    private readonly chatStore: ChatStore,
    private readonly projectStore: ProjectStore,
    private readonly fileReferenceStore: FileReferenceStore,
    private readonly chatContextService: ChatContextService,
  ) {}
  init() {
    const router = express.Router();

    router.get(
      "/list-project-chats/:projectId",
      async (req: express.Request, res: express.Response) => {
        const body = ZListProjectChatRequest.parse(req.params);
        const chats = await this.chatStore.listProjectChats(body.projectId);
        res.json({ chats });
      },
    );

    router.get(
      "/list-file-chats/:fileReferenceId",
      async (req: express.Request, res: express.Response) => {
        const body = ZListFileChatRequest.parse(req.params);
        const chats = await this.chatStore.listfileReferenceChats(
          body.fileReferenceId,
        );
        res.json({ chats });
      },
    );

    router.post(
      "/create-chat",
      async (req: express.Request, res: express.Response) => {
        const body = ZCreateChatRequest.parse(req.body);

        const value = await (async () => {
          switch (body.location) {
            case "project":
              return {
                projectId: body.id,
              };
            case "file": {
              const file = await this.fileReferenceStore.get(body.id);
              return {
                projectId: file.projectId,
                fileReferenceId: file.id,
              };
            }
            default:
              assertNever(body.location);
          }
        })();

        const chat = await this.chatStore.insertChat({
          ...value,
          organizationId: req.user.organizationId,
          creatorId: req.user.id,
          name: body.name,
        });

        await this.projectStore.addToChatCount(value.projectId, 1);

        res.json({ chat });
      },
    );

    router.delete(
      "/delete-chat",
      async (req: express.Request, res: express.Response) => {
        const body = ZDeleteChatRequest.parse(req.body);
        const deleted = await this.chatStore.deleteChat(body.chatId);

        if (deleted) {
          await this.projectStore.addToChatCount(body.projectId, -1);
        }
        res.json({ status: "ok" });
      },
    );

    router.get(
      "/chat-entry/:chatId",
      async (req: express.Request, res: express.Response) => {
        const body = ZGetChatEntryRequest.parse(req.params);

        const chatEntries = await this.chatStore.listChatEntries(body.chatId);

        res.json({ chatEntries });
      },
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

        const context = await this.chatContextService.getContext(args);

        setStreamingCookies(res);

        const answerBuffer: string[] = [];

        await this.mlClient.askQuestionStreaming({
          context,
          onData: (resp) => {
            const encoded = encoder.encode(resp);
            res.write(encoded);
            answerBuffer.push(resp);
          },
          onEnd: async () => {
            const answer = answerBuffer.join("");

            const html = await this.mlClient.htmlFromText({
              text: answer,
              id: randomUUID(),
            });

            const prompt = await this.mlClient.prompt(context);
            await this.chatStore.insertChatEntry({
              organizationId: req.user.organizationId,
              projectId: args.projectId,
              creatorId: req.user.id,
              chatId: args.chatId,
              question: args.question,
              answer,
              prompt,
              html,
            });
            if (context.shouldGenerateName) {
              res.write("__REFRESH__");
              const name = await this.mlClient.getTitle({
                question: args.question,
                answer,
              });

              await this.chatStore.updateChat({
                chatId: args.chatId,
                name,
              });
            }

            res.end();
          },
        });
      },
    );

    router.get(
      "/prompt/:chatEntryId",
      async (req: express.Request, res: express.Response) => {
        const args = ZContextRequest.parse(req.params);
        const prompt = await this.chatStore.getPrompt(args.chatEntryId);
        res.json({ prompt });
      },
    );

    return router;
  }
}

const ZEditChatRequest = z.object({
  id: z.string(),
  name: z.string(),
});

const ZChatArguments = z.object({
  projectId: z.string(),
  question: z.string(),
  chatId: z.string(),
});

const ZListProjectChatRequest = z.object({ projectId: z.string() });
const ZListFileChatRequest = z.object({ fileReferenceId: z.string() });

const ZGetChatEntryRequest = z.object({ chatId: z.string() });

const ZChatLocation = z.enum(["project", "file"]);

const ZCreateChatRequest = z.object({
  id: z.string(),
  location: ZChatLocation,
  name: z.string().optional(),
});

const ZDeleteChatRequest = z.object({
  chatId: z.string(),
  projectId: z.string(),
});

const ZContextRequest = z.object({
  chatEntryId: z.string(),
});

function setStreamingCookies(res: express.Response) {
  res.set("Content-Type", "text/event-stream");
  res.set("Cache-Control", "no-cache");
  res.set("Connection", "keep-alive");
}

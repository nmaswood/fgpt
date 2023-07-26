import { groupBy, orderBy, uniqBy } from "lodash";
import { z } from "zod";

import { ChatStore } from "../chat-store";
import { FileReferenceStore } from "../file-reference-store";
import { MLServiceClient } from "../ml/ml-service";
import { VectorService } from "../ml/vector-service";
import { TextChunkStore } from "../text-chunk-store";
import { ChatContextResponse, ChatFileContext } from "./chat-models";

export interface GetContextArgs {
  projectId: string;
  chatId: string;
  question: string;
}

export interface ChatContextService {
  getContext(args: GetContextArgs): Promise<ChatContextResponse>;
}

export class ChatContextServiceImpl implements ChatContextService {
  constructor(
    private readonly mlClient: MLServiceClient,
    private readonly textChunkStore: TextChunkStore,
    private readonly chatStore: ChatStore,
    private readonly fileReferenceStore: FileReferenceStore,
    private readonly vectorService: VectorService,
  ) {}

  async getContext({
    projectId,
    chatId,
    question,
  }: GetContextArgs): Promise<ChatContextResponse> {
    const [chat, vector, history] = await Promise.all([
      this.chatStore.getChat(chatId),
      this.mlClient.getEmbedding(question),
      this.chatStore.listChatHistory(chatId),
    ]);

    const metadata = chat.fileReferenceId
      ? { fileId: chat.fileReferenceId }
      : { projectId };

    const similarDocuments = await this.#similarDocuments(vector, metadata);

    const collectedIds = this.#collectIds(similarDocuments);

    const [files, textChunks] = await Promise.all([
      this.fileReferenceStore.getMany(collectedIds.fileIds),
      this.textChunkStore.getTextChunks(collectedIds.textChunkIds),
    ]);

    const textChunkIdsByFile = groupBy(
      textChunks,
      (chunk) => chunk.fileReferenceId,
    );

    const forFiles: ChatFileContext[] = files.map(
      (file): ChatFileContext => ({
        fileName: file.fileName,
        chunks: orderBy(
          textChunkIdsByFile[file.id] ?? [],
          (chunk) => chunk.chunkOrder,
        ).map((chunk) => ({
          content: chunk.chunkText,
          order: chunk.chunkOrder,
        })),
      }),
    );

    return {
      forFiles,
      history,
      shouldGenerateName: chat.name === undefined && history.length === 0,
    };
  }

  #collectIds = (
    collections: {
      id: string;
      metadata: {
        fileId: string;
        next: string | undefined;
        prev: string | undefined;
      };
    }[],
  ): CollectedIds => {
    const fileIds = new Set<string>();
    const chunkIds = new Set<string>();

    for (const {
      id,
      metadata: { fileId, next, prev },
    } of collections) {
      fileIds.add(fileId);
      chunkIds.add(id);
      if (next) {
        chunkIds.add(next);
      }
      if (prev) {
        chunkIds.add(prev);
      }
    }

    return {
      fileIds: [...fileIds],
      textChunkIds: [...chunkIds],
    };
  };

  #similarDocuments = async (
    vector: number[],
    metadata: Record<string, string>,
  ) => {
    const docs = await this.vectorService.getKSimilar({
      vector,
      metadata,
    });

    const uniqDocs = uniqBy(docs, (doc) => doc.id);
    return uniqDocs.map(({ id, score, metadata }) => ({
      id,
      score,
      metadata: ZVectorMetadata.parse(metadata),
    }));
  };
}

export interface CollectedIds {
  textChunkIds: string[];
  fileIds: string[];
}

export const ZVectorMetadata = z
  .object({
    fileId: z.string(),
    next: z.string().optional(),
    prev: z.string().optional(),
  })
  .transform((row) => ({
    fileId: row.fileId,
    next: row.next ?? undefined,
    prev: row.prev ?? undefined,
  }));

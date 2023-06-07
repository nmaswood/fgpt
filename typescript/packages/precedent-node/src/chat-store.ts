import {
  Chat,
  ChatEntry,
  MAX_CHAT_LIMIT,
  ChatHistory,
} from "@fgpt/precedent-iso";
import { DatabasePool, DatabaseTransactionConnection, sql } from "slonik";
import { z } from "zod";

import { ZCountRow } from "./sql/models";

export interface InsertChat {
  organizationId: string;
  projectId: string;
  creatorId: string;
  name?: string;
}

export interface UpdateChat {
  chatId: string;
  name: string;
}

export interface InsertChatEntry {
  organizationId: string;
  projectId: string;
  creatorId: string;
  chatId: string;
  question: string;
  context: string;
  answer: string;
}

export interface UpdateChatEntry {
  chatEntryId: string;
  answer: string;
}

const CHAT_FIELDS = sql.fragment`chat.id as chat_id, chat.name as chat_name`;
const CHAT_ENTRY_FIELDS = sql.fragment`chat_entry.id as chat_entry_id, question_v2 as question, answer`;

export interface ChatStore {
  insertChat(chat: InsertChat): Promise<Chat>;
  updateChat(update: UpdateChat): Promise<Chat>;
  insertChatEntry(chatEntry: InsertChatEntry): Promise<ChatEntry>;
  updateChatEntry(chatEntry: UpdateChatEntry): Promise<ChatEntry>;
  listChats(projectId: string): Promise<Chat[]>;
  listChatEntries(chatId: string): Promise<ChatEntry[]>;
  deleteChat(chatId: string): Promise<void>;
  listChatHistory(chatId: string): Promise<ChatHistory[]>;
}

export class PsqlChatStore implements ChatStore {
  constructor(private readonly pool: DatabasePool) {}

  async insertChat(chat: InsertChat): Promise<Chat> {
    return this.pool.transaction(async (trx) => this.#insertChat(trx, chat));
  }

  async #insertChat(
    trx: DatabaseTransactionConnection,
    chat: InsertChat
  ): Promise<Chat> {
    const count = await trx.oneFirst(sql.type(ZCountRow)`
SELECT
    COUNT(*) as count
FROM
    chat
WHERE
    project_id = ${chat.projectId}
`);
    if (count === MAX_CHAT_LIMIT) {
      throw new Error("max limit reached");
    }
    return trx.one(sql.type(ZChatRow)`
INSERT INTO chat (organization_id, project_id, creator_id, name)
    VALUES (${chat.organizationId}, ${chat.projectId}, ${chat.creatorId}, ${
      chat.name ?? null
    })
RETURNING
    ${CHAT_FIELDS}
`);
  }

  async updateChat({ chatId, name }: UpdateChat): Promise<Chat> {
    return this.pool.one(sql.type(ZChatRow)`
UPDATE
    chat
SET
    name = ${name}
WHERE
    id = ${chatId}
RETURNING
    ${CHAT_FIELDS}
`);
  }

  async insertChatEntry(chatEntry: InsertChatEntry): Promise<ChatEntry> {
    return this.pool.transaction(async (trx) =>
      this.#insertChatEntry(trx, chatEntry)
    );
  }

  async #insertChatEntry(
    trx: DatabaseTransactionConnection,
    {
      organizationId,
      projectId,
      chatId,
      creatorId,
      question,
      context,
      answer,
    }: InsertChatEntry
  ): Promise<ChatEntry> {
    const count = await trx.oneFirst(sql.type(ZCountRow)`
SELECT
    COUNT(*) as count
FROM
    chat_entry
WHERE
    chat_id = ${chatId}
`);
    if (count === MAX_CHAT_LIMIT) {
      throw new Error("max limit reached");
    }

    return trx.one(sql.type(ZChatEntryRow)`
INSERT INTO chat_entry (organization_id, project_id, creator_id, chat_id, question_v2, context, answer, entry_order)
    VALUES (${organizationId}, ${projectId}, ${creatorId}, ${chatId}, ${question}, ${context}, ${JSON.stringify(
      {
        answer,
      }
    )}, COALESCE((
            SELECT
                MAX(entry_order)
                FROM chat_entry
            WHERE
                chat_id = ${chatId}), 0) + 1)
RETURNING
    ${CHAT_ENTRY_FIELDS}
`);
  }

  async updateChatEntry({
    answer,
    chatEntryId,
  }: UpdateChatEntry): Promise<ChatEntry> {
    return this.pool.one(sql.type(ZChatEntryRow)`
UPDATE
    chat_entry
SET
    answer = ${JSON.stringify({
      answer,
    })}
WHERE
    id = ${chatEntryId}
RETURNING
    ${CHAT_ENTRY_FIELDS}
`);
  }

  async listChats(projectId: string): Promise<Chat[]> {
    const resp = await this.pool.query(sql.type(ZChatRow)`
SELECT
    ${CHAT_FIELDS}
FROM
    chat
WHERE
    project_id = ${projectId}
ORDER BY
    chat.created_at DESC
`);
    return Array.from(resp.rows);
  }

  async listChatEntries(chatId: string): Promise<ChatEntry[]> {
    const result = await this.pool.query(sql.type(ZChatEntryRow)`
SELECT
    ${CHAT_ENTRY_FIELDS}
FROM
    chat_entry
WHERE
    chat_id = ${chatId}
`);
    return Array.from(result.rows);
  }

  async deleteChat(chatId: string): Promise<void> {
    await this.pool.transaction(async (trx) => {
      await trx.query(sql.unsafe`
DELETE FROM chat_entry
where chat_id = ${chatId}
`);
      await trx.query(sql.unsafe`
DELETE FROM chat
where id = ${chatId}
`);
    });
  }

  async listChatHistory(chatId: string): Promise<ChatHistory[]> {
    const resp = await this.pool.query(sql.type(ZChatHistory)`
SELECT
  question_v2 as question
FROM
    chat_entry
WHERE
    chat_id = ${chatId}
ORDER BY
    entry_order
    ASC
`);
    return Array.from(resp.rows);
  }
}

const ZChatRow = z
  .object({
    chat_id: z.string(),
    chat_name: z.string().nullable(),
  })
  .transform(
    (row): Chat => ({
      id: row.chat_id,
      name: row.chat_name ?? undefined,
    })
  );

const ZChatEntryAnswer = z.object({
  answer: z.string(),
});

const ZChatEntryRow = z
  .object({
    chat_entry_id: z.string(),
    question: z.string(),
    answer: ZChatEntryAnswer.nullable(),
  })
  .transform(
    (row): ChatEntry => ({
      id: row.chat_entry_id,
      question: row.question,
      answer: row.answer?.answer ?? undefined,
    })
  );

const ZChatHistory = z.object({
  question: z.string(),
});

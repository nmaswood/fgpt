import {
  Chat,
  ChatEntry,
  ChatHistory,
  MAX_CHAT_LIMIT,
} from "@fgpt/precedent-iso";
import { DatabasePool, DatabaseTransactionConnection, sql } from "slonik";
import { z } from "zod";

import { ZCountRow } from "./sql/models";

export interface InsertChat {
  organizationId: string;
  projectId: string;
  creatorId: string;
  fileReferenceId?: string;
  name: string | undefined;
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
  prompt: string;
  answer: string;
  html: string | undefined;
}

export interface UpdateChatEntry {
  chatEntryId: string;
  answer: string;
}

const CHAT_FIELDS = sql.fragment`chat.id as chat_id, chat.name as chat_name, chat.file_reference_id as file_reference_id, COALESCE(chat_entry_count, 0) as chat_entry_count`;
const CHAT_ENTRY_FIELDS = sql.fragment`chat_entry.id as chat_entry_id, question_v2 as question, answer, html, entry_order as index`;

export interface ChatStore {
  getChat(id: string): Promise<Chat>;
  insertChat(chat: InsertChat): Promise<Chat>;
  updateChat(update: UpdateChat): Promise<Chat>;
  insertChatEntry(chatEntry: InsertChatEntry): Promise<ChatEntry>;
  updateChatEntry(chatEntry: UpdateChatEntry): Promise<ChatEntry>;
  listProjectChats(projectId: string): Promise<Chat[]>;
  listfileReferenceChats(fileReferenceId: string): Promise<Chat[]>;

  getChatEntry(chatId: string): Promise<ChatEntry>;
  listChatEntries(chatId: string): Promise<ChatEntry[]>;

  deleteChat(chatId: string): Promise<boolean>;
  listChatHistory(chatId: string): Promise<ChatHistory[]>;
  getPrompt(chatEntryId: string): Promise<string>;
}

export class PsqlChatStore implements ChatStore {
  constructor(private readonly pool: DatabasePool) {}

  async getChat(id: string): Promise<Chat> {
    return this.pool.one(sql.type(ZChatRow)`
SELECT
    ${CHAT_FIELDS}
FROM
    chat
WHERE
    id = ${id}
`);
  }

  async insertChat(chat: InsertChat): Promise<Chat> {
    return this.pool.transaction(async (trx) => this.#insertChat(trx, chat));
  }

  async #insertChat(
    trx: DatabaseTransactionConnection,
    chat: InsertChat,
  ): Promise<Chat> {
    const count = await trx.oneFirst(sql.type(ZCountRow)`
SELECT
    COALESCE(chat_count, 0) as count
FROM
    PROJECT
WHERE
    id = ${chat.projectId}
`);
    if (count === MAX_CHAT_LIMIT) {
      throw new Error("max limit reached");
    }
    return trx.one(sql.type(ZChatRow)`
INSERT INTO chat (organization_id, project_id, creator_id, name, file_reference_id, chat_entry_count)
    VALUES (${chat.organizationId}, ${chat.projectId}, ${chat.creatorId}, ${
      chat.name ?? null
    }, ${chat.fileReferenceId ?? null}, 0)
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
      this.#insertChatEntry(trx, chatEntry),
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
      prompt,
      answer,
      html,
    }: InsertChatEntry,
  ): Promise<ChatEntry> {
    await trx.query(sql.unsafe`
UPDATE
    chat
SET
    chat_entry_count = COALESCE(chat_entry_count, 0) + 1
WHERE
    id = ${chatId}
`);

    return trx.one(sql.type(ZChatEntryRow)`
INSERT INTO chat_entry (organization_id, project_id, creator_id, chat_id, question_v2, prompt, html, answer_v2, entry_order)
    VALUES (${organizationId}, ${projectId}, ${creatorId}, ${chatId}, ${question}, ${prompt}, ${
      html ?? null
    }, ${answer}, COALESCE((
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

  async listProjectChats(projectId: string): Promise<Chat[]> {
    const resp = await this.pool.query(sql.type(ZChatRow)`
SELECT
    ${CHAT_FIELDS}
FROM
    chat
WHERE
    project_id = ${projectId}
    AND file_reference_id IS NULL
ORDER BY
    chat.created_at DESC
`);
    return Array.from(resp.rows);
  }

  async listfileReferenceChats(fileReferenceId: string): Promise<Chat[]> {
    const resp = await this.pool.query(sql.type(ZChatRow)`
SELECT
    ${CHAT_FIELDS}
FROM
    chat
WHERE
    file_reference_id = ${fileReferenceId}
ORDER BY
    chat.created_at DESC
`);
    return Array.from(resp.rows);
  }

  async getChatEntry(chatEntryId: string): Promise<ChatEntry> {
    return this.pool.one(sql.type(ZChatEntryRow)`
SELECT
    ${CHAT_ENTRY_FIELDS}
FROM
    chat_entry
WHERE
    id = ${chatEntryId}
`);
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
    const copy = Array.from(result.rows);
    return copy.sort((a, b) => a.index - b.index);
  }

  async deleteChat(chatId: string): Promise<boolean> {
    return this.pool.transaction(async (trx) => {
      await trx.query(sql.unsafe`
DELETE FROM chat_entry
where chat_id = ${chatId}
`);
      const { rowCount } = await trx.query(sql.unsafe`
DELETE FROM chat
where id = ${chatId}
`);
      return rowCount > 0;
    });
  }

  async listChatHistory(chatId: string): Promise<ChatHistory[]> {
    const resp = await this.pool.query(sql.type(ZChatHistory)`
SELECT
    question_v2 as question,
    answer_v2 as answer
FROM
    chat_entry
WHERE
    chat_id = ${chatId}
ORDER BY
    entry_order ASC
`);
    return Array.from(resp.rows);
  }

  async getPrompt(chatEntryId: string): Promise<string> {
    return this.pool.oneFirst(sql.type(ZGetPrompt)`
SELECT
    prompt
FROM
    chat_entry
WHERE
    id = ${chatEntryId}
`);
  }
}

const ZGetPrompt = z.object({
  prompt: z.string(),
});

const ZChatRow = z
  .object({
    chat_id: z.string(),
    chat_name: z.string().nullable(),
    file_reference_id: z.string().nullable(),
    chat_entry_count: z.number(),
  })
  .transform(
    (row): Chat => ({
      id: row.chat_id,
      name: row.chat_name ?? undefined,
      fileReferenceId: row.file_reference_id ?? undefined,
      entryCount: row.chat_entry_count,
    }),
  );

const ZChatEntryAnswer = z.object({
  answer: z.string(),
});

const ZChatEntryRow = z
  .object({
    chat_entry_id: z.string(),
    question: z.string(),
    answer: ZChatEntryAnswer.nullable(),
    html: z.string().nullable(),
    index: z.number(),
  })
  .transform(
    (row): ChatEntry => ({
      id: row.chat_entry_id,
      question: row.question,
      answer: row.answer?.answer ?? undefined,
      html: row.html ?? undefined,
      index: row.index,
    }),
  );

const ZChatHistory = z.object({
  question: z.string(),
  answer: z.string(),
});

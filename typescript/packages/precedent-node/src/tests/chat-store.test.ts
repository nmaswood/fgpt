import { sql } from "slonik";
import { beforeEach, expect, test } from "vitest";

import { PsqlChatStore } from "../chat-store";
import { dataBasePool } from "../data-base-pool";
import { PsqlFileReferenceStore } from "../file-reference-store";
import { PSqlProjectStore } from "../project-store";
import { PsqlUserOrgService } from "../user-org/user-org-service";
import { TEST_SETTINGS } from "./test-settings";

async function setup() {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  const userOrgService = new PsqlUserOrgService(pool);
  const projectService = new PSqlProjectStore(pool);
  const fileReferenceStore = new PsqlFileReferenceStore(pool);

  const user = await userOrgService.upsert({
    sub: {
      provider: "google",
      value: "abc",
    },
    email: "nasr@test.com",
  });

  const project = await projectService.create({
    name: "test-project",
    creatorUserId: user.id,
    organizationId: user.organizationId,
  });

  const chatStore = new PsqlChatStore(pool);
  const file = await fileReferenceStore.insert({
    fileName: "hi",
    organizationId: user.organizationId,
    projectId: project.id,
    bucketName: "test",
    path: "test",
    contentType: "application/pdf",
  });
  return {
    creatorId: user.id,
    projectId: project.id,
    organizationId: user.organizationId,
    fileReferenceId: file.id,
    chatStore,
  };
}

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE organization, app_user, project, chat, chat_entry CASCADE`
  );
});

test("insertChat", async () => {
  const { creatorId, projectId, organizationId, chatStore, fileReferenceId } =
    await setup();

  const chat = await chatStore.insertChat({
    organizationId,
    projectId,
    creatorId,
    name: "I love cows",
  });

  expect(chat.name).toEqual("I love cows");
  expect(chat.fileReferenceId).toBeUndefined();

  const fileChat = await chatStore.insertChat({
    organizationId,
    projectId,
    creatorId,
    name: "I love cows",
    fileReferenceId,
  });

  expect(fileChat.fileReferenceId).toBeDefined();
});

test("listProjectChats", async () => {
  const { creatorId, projectId, organizationId, chatStore, fileReferenceId } =
    await setup();

  const chat = await chatStore.insertChat({
    organizationId,
    projectId,
    creatorId,
    name: "I love cows",
  });

  await chatStore.insertChat({
    organizationId,
    projectId,
    creatorId,
    name: "I love cows",
    fileReferenceId,
  });

  const chats = await chatStore.listProjectChats(projectId);
  const [firstChat, secondChat] = chats;

  expect(firstChat.name).toEqual(chat.name);
  expect(chat.id).toEqual(firstChat.id);
  expect(secondChat).toBeUndefined();
});

test("updateChat", async () => {
  const { creatorId, projectId, organizationId, chatStore } = await setup();

  const chat = await chatStore.insertChat({
    organizationId,
    projectId,
    creatorId,
    name: "I love cows",
  });

  const renamed = await chatStore.updateChat({
    chatId: chat.id,
    name: "I love lamp",
  });

  expect(renamed.name).toEqual("I love lamp");
});

test("insertChatEntry", async () => {
  const { creatorId, projectId, organizationId, chatStore } = await setup();

  const chat = await chatStore.insertChat({
    organizationId,
    projectId,
    creatorId,
    name: "I love cows",
  });

  const chatEntry = await chatStore.insertChatEntry({
    organizationId,
    projectId,
    creatorId,
    chatId: chat.id,
    question: "What is your favorite color?",
    context: [],
    answer: "answer",
  });

  expect(chatEntry.question).toEqual("What is your favorite color?");
});

test("updateChatEntry", async () => {
  const { creatorId, projectId, organizationId, chatStore } = await setup();

  const chat = await chatStore.insertChat({
    organizationId,
    projectId,
    creatorId,
    name: "I love cows",
  });

  const chatEntry = await chatStore.insertChatEntry({
    organizationId,
    projectId,
    creatorId,
    chatId: chat.id,
    question: "What is your favorite color?",

    context: [],
    answer: "answer",
  });

  const renamedChatEntry = await chatStore.updateChatEntry({
    chatEntryId: chatEntry.id,
    answer: "blue",
  });

  expect(renamedChatEntry.question).toEqual("What is your favorite color?");
  expect(renamedChatEntry.answer).toEqual("blue");
});

test("listChatEntry", async () => {
  const { creatorId, projectId, organizationId, chatStore } = await setup();

  const chat = await chatStore.insertChat({
    organizationId,
    projectId,
    creatorId,
    name: "I love cows",
  });

  const chatEntry = await chatStore.insertChatEntry({
    organizationId,
    projectId,
    creatorId,
    chatId: chat.id,
    question: "What is your favorite color?",
    context: [],
    answer: "answer",
  });

  const foo = await chatStore.getChatEntry(chatEntry.id);

  expect(foo.id).toEqual(chatEntry.id);
});

test("listChatEntries", async () => {
  const { creatorId, projectId, organizationId, chatStore } = await setup();

  const chat = await chatStore.insertChat({
    organizationId,
    projectId,
    creatorId,
    name: "I love cows",
  });

  const chatEntry = await chatStore.insertChatEntry({
    organizationId,
    projectId,
    creatorId,
    chatId: chat.id,
    question: "What is your favorite color?",
    context: [],
    answer: "answer",
  });

  const [firstChatEntry] = await chatStore.listChatEntries(chat.id);

  expect(firstChatEntry.id).toEqual(chatEntry.id);
});

test("deleteChat", async () => {
  const { creatorId, projectId, organizationId, chatStore } = await setup();

  const chat = await chatStore.insertChat({
    organizationId,
    projectId,
    creatorId,
    name: "I love cows",
  });

  await chatStore.insertChatEntry({
    organizationId,
    projectId,
    creatorId,
    chatId: chat.id,
    question: "What is your favorite color?",
    context: [],
    answer: "answer",
  });

  const entries = await chatStore.listChatEntries(chat.id);
  expect(entries.length).toEqual(1);

  await chatStore.deleteChat(chat.id);
  const entriesAfterDelete = await chatStore.listChatEntries(chat.id);
  expect(entriesAfterDelete.length).toEqual(0);

  const chatsAfterDelete = await chatStore.listProjectChats(projectId);
  expect(chatsAfterDelete.length).toEqual(0);
});

test("listChatHistory", async () => {
  const { creatorId, projectId, organizationId, chatStore } = await setup();

  const chat = await chatStore.insertChat({
    organizationId,
    projectId,
    creatorId,
    name: "I love cows",
  });

  await chatStore.insertChatEntry({
    organizationId,
    projectId,
    creatorId,
    chatId: chat.id,
    question: "What is your favorite color?",
    context: [],
    answer: "answer",
  });

  const [history] = await chatStore.listChatHistory(chat.id);
  expect(history.question).toEqual("What is your favorite color?");
});

test("getContext", async () => {
  const { creatorId, projectId, organizationId, chatStore } = await setup();

  const chat = await chatStore.insertChat({
    organizationId,
    projectId,
    creatorId,
    name: "I love cows",
  });

  const entry = await chatStore.insertChatEntry({
    organizationId,
    projectId,
    creatorId,
    chatId: chat.id,
    question: "What is your favorite color?",
    context: [
      {
        filename: "hi.pdf",
        score: 0.5,
        text: "hi",
        fileId: "hi",
      },
    ],
    answer: "answer",
  });

  const [context] = await chatStore.getContext(entry.id);
  expect(context.filename).toEqual("hi.pdf");
});

test("getChat", async () => {
  const { creatorId, projectId, organizationId, chatStore } = await setup();

  const chat = await chatStore.insertChat({
    organizationId,
    projectId,
    creatorId,
    name: "I love cows",
  });

  const chatAgain = await chatStore.getChat(chat.id);

  expect(chatAgain.id).toEqual(chat.id);
});

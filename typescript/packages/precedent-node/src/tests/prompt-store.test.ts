import { sql } from "slonik";
import { beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PsqlPromptStore } from "../prompt/prompt-store";
import { TEST_SETTINGS } from "./test-settings";

async function setup() {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  const promptStore = new PsqlPromptStore(pool);

  return {
    store: promptStore,
  };
}

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(sql.unsafe`TRUNCATE TABLE prompt CASCADE`);
});

test("upsert", async () => {
  const { store } = await setup();

  const prompt = await store.upsert({
    slug: "test",
    definition: {
      template: "test",
    },
  });

  expect(prompt.slug).toBe("test");
});

test("get", async () => {
  const { store } = await setup();

  const prompt = await store.upsert({
    slug: "test",
    definition: {
      template: "test",
    },
  });

  const prompt2 = await store.get("test");
  expect(prompt2).toEqual(prompt);
});

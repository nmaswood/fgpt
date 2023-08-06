import { sql } from "slonik";
import { beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PsqlPromptInvocationStore } from "../prompt/prompt-invocation-store";
import { PsqlPromptStore } from "../prompt/prompt-store";
import { PsqlUserOrgService } from "../user-org/user-org-service";
import { TEST_SETTINGS } from "./test-settings";

async function setup() {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  const promptStore = new PsqlPromptStore(pool);
  const store = new PsqlPromptInvocationStore(pool);
  const userOrgService = new PsqlUserOrgService(pool);

  const prompt = await promptStore.upsert({
    slug: "kpi",
    definition: {
      template: "test",
    },
  });
  const user = await userOrgService.upsert({
    sub: {
      provider: "google",
      value: "abc",
    },
    email: "nasr@test.com",
  });

  return {
    store,
    promptId: prompt.id,
    organizationId: user.organizationId,
  };
}

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  await pool.query(
    sql.unsafe`TRUNCATE TABLE prompt, prompt_invocation CASCADE`,
  );
});

test("insert", async () => {
  const { store, promptId, organizationId } = await setup();

  const prompt = await store.insert({
    model: "claude-100",
    organizationId,
    promptId,
    inputTokens: 1,
    outputTokens: 1,
  });

  expect(prompt).toBeDefined();
});

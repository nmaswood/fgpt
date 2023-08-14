import axios from "axios";
import { sql } from "slonik";
import { beforeEach, expect, test } from "vitest";

import { dataBasePool } from "../data-base-pool";
import { PsqlPromptInvocationStore } from "../prompt/prompt-invocation-store";
import { DUMMY_PROMPT_RUNNER, HTTPPromptRunner } from "../prompt/prompt-runner";
import { PromptServiceImpl } from "../prompt/prompt-service";
import { PsqlPromptStore } from "../prompt/prompt-store";
import { PsqlUserOrgService } from "../user-org/user-org-service";
import { TEST_SETTINGS } from "./test-settings";

beforeEach(async () => {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);
  await pool.query(
    sql.unsafe`TRUNCATE TABLE organization, app_user, project, task, file_reference  CASCADE`,
  );
});

async function setup() {
  const pool = await dataBasePool(TEST_SETTINGS.sqlUri);

  const userOrgService = new PsqlUserOrgService(pool);
  const user = await userOrgService.upsert({
    sub: {
      provider: "google",
      value: "abc",
    },
    email: "nasr@test.com",
  });
  const client = axios.create({
    baseURL: TEST_SETTINGS.springtimeUri,
  });

  const httpPromperRunner = new HTTPPromptRunner(client);

  const promptStore = new PsqlPromptStore(pool);
  const promptInvocationStore = new PsqlPromptInvocationStore(pool);

  const prompt = await promptStore.upsert({
    slug: "kpi",
    definition: {
      template: `Respond with the next letter in the alphabet after {letter}`,
    },
  });

  const mockPromptService = new PromptServiceImpl(
    DUMMY_PROMPT_RUNNER,
    promptStore,
    promptInvocationStore,
  );
  const httpPromptService = new PromptServiceImpl(
    httpPromperRunner,
    promptStore,
    promptInvocationStore,
  );

  return {
    prompt,
    mockPromptService,
    httpPromptService,
    user,
  };
}

test("run#mock", async () => {
  const { mockPromptService, user } = await setup();

  await mockPromptService.run({
    model: "claude-2",
    organizationId: user.organizationId,
    slug: "kpi",
    args: {
      letter: "A",
    },
  });

  expect(1).toBe(1);
});
test.skip("run#real", async () => {
  const { httpPromptService, user } = await setup();

  await httpPromptService.run({
    model: "claude-2",
    organizationId: user.organizationId,
    slug: "kpi",
    args: {
      letter: "A",
    },
  });

  expect(1).toEqual(1);
}, 200_000_000);

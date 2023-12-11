import { ZPromptSlug } from "@fgpt/precedent-iso";
import { PromptStore, UserOrgService } from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class AdminRouter {
  constructor(
    private readonly userOrgService: UserOrgService,
    private readonly promptStore: PromptStore,
  ) {}
  init() {
    const router = express.Router();
    router.get("/users", async (_: express.Request, res: express.Response) => {
      res.json({ users: await this.userOrgService.listUsers() });
    });

    router.get(
      "/organizations",
      async (_: express.Request, res: express.Response) => {
        res.json({
          organizations: await this.userOrgService.listOrganizations(),
        });
      },
    );

    router.get(
      "/invitations",
      async (_: express.Request, res: express.Response) => {
        res.json({ users: await this.userOrgService.listInvites() });
      },
    );

    router.put(
      "/invite",
      async (req: express.Request, res: express.Response) => {
        const body = ZInviteUser.parse(req.body);
        await this.userOrgService.createInvite(body);
        res.json({ status: "ok" });
      },
    );

    router.get(
      "/prompts",
      async (_: express.Request, res: express.Response) => {
        const prompts = await this.promptStore.list();
        res.json({ prompts });
      },
    );

    router.put(
      "/upsert-prompt",
      async (req: express.Request, res: express.Response) => {
        const { slug, template } = ZUpsertPrompt.parse(req.body);
        const prompt = await this.promptStore.upsert({
          slug,
          definition: { template },
        });
        res.json({ prompt });
      },
    );
    return router;
  }
}

const ZInviteUser = z
  .object({
    email: z.string().email(),
    organizationId: z.string().optional(),
  })
  .transform((row) => ({
    email: row.email.toLowerCase(),
    organizationId: row.organizationId || undefined,
  }));

const ZUpsertPrompt = z.object({
  slug: ZPromptSlug,
  template: z.string(),
});

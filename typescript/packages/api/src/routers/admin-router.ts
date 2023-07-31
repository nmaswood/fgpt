import { UserOrgService } from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class AdminRouter {
  constructor(private readonly userOrgService: UserOrgService) {}
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

import { UserOrgService } from "@fgpt/precedent-node";
import { z } from "zod";
import express from "express";

export class AdminRouter {
  constructor(private readonly userOrgService: UserOrgService) {}
  init() {
    const router = express.Router();
    router.get("/users", async (_: express.Request, res: express.Response) => {
      res.json({ users: await this.userOrgService.list() });
    });

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
        res.json({ body });
      },
    );
    return router;
  }
}

const ZInviteUser = z.object({
  email: z.string().email(),
  organizationId: z.string().optional(),
});

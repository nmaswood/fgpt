import { UserOrgService } from "@fgpt/precedent-node";
import express from "express";

export class AdminRouter {
  constructor(private readonly userOrgService: UserOrgService) {}
  init() {
    const router = express.Router();
    router.get(
      "/users",
      async (req: express.Request, res: express.Response) => {
        const users = await this.userOrgService.list();
        res.json({ users });
      },
    );

    return router;
  }
}

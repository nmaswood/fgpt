import { UserOrgService } from "@fgpt/precedent-node";
import express from "express";

export class AdminRouter {
  constructor(private readonly userOrgService: UserOrgService) {}
  init() {
    const router = express.Router();
    router.get("/users", async (_: express.Request, res: express.Response) => {
      res.json({ users: await this.userOrgService.list() });
    });

    return router;
  }
}

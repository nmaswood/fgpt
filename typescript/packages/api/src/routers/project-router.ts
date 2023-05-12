import { ProjectStore } from "@fgpt/precedent-node";
import express from "express";

export class ProjectRouter {
  constructor(private readonly projectStore: ProjectStore) {}
  init() {
    const router = express.Router();

    router.get("/list", async (req: express.Request, res: express.Response) => {
      const user = req.user;

      const projects = await this.projectStore.list(user.id);
      res.json({ projects });
    });

    router.post(
      "/create",
      async (req: express.Request, res: express.Response) => {
        const user = req.user;
        res.json({ user });
      }
    );

    return router;
  }
}

import { ProjectStore } from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class ProjectRouter {
  constructor(private readonly projectStore: ProjectStore) {}
  init() {
    const router = express.Router();

    router.get("/list", async (req: express.Request, res: express.Response) => {
      const projects = await this.projectStore.list(req.user.organizationId);
      res.json({ projects });
    });

    router.post(
      "/create",
      async (req: express.Request, res: express.Response) => {
        const user = req.user;
        const args = ZCreateProjectArgs.parse(req.body);
        const project = await this.projectStore.create({
          name: args.name,
          organizationId: user.organizationId,
          creatorUserId: user.id,
        });

        res.json({ project });
      }
    );

    return router;
  }
}

const ZCreateProjectArgs = z.object({
  name: z.string(),
});

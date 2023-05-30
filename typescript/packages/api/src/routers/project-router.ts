import { ProjectStore, TaskService } from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class ProjectRouter {
  constructor(
    private readonly projectStore: ProjectStore,
    private readonly taskService: TaskService
  ) {}
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

    router.delete(
      "/delete/:projectId",
      async (req: express.Request, res: express.Response) => {
        const projectId = req.params.projectId;
        if (typeof projectId !== "string") {
          throw new Error("invalid request");
        }

        await this.projectStore.delete(projectId);
        res.json({ status: "ok" });
      }
    );

    router.patch(
      "/update",
      async (req: express.Request, res: express.Response) => {
        const user = req.user;
        const args = ZUpdateProjectArgs.parse(req.body);
        const project = await this.projectStore.update(args);

        await this.taskService.insert({
          organizationId: user.organizationId,
          projectId: project.id,
          config: {
            type: "delete-project",
            version: "1",
            projectId: project.id,
          },
        });

        res.json({ project });
      }
    );

    return router;
  }
}

const ZUpdateProjectArgs = z.object({
  id: z.string(),
  name: z.string(),
});

const ZCreateProjectArgs = z.object({
  name: z.string(),
});

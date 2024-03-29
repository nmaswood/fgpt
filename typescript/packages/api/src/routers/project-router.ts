import { ProjectStore, UserOrgService } from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class ProjectRouter {
  constructor(
    private readonly projectStore: ProjectStore,
    private readonly userOrgService: UserOrgService,
  ) {}
  init() {
    const router = express.Router();

    router.get(
      "/project/:id",
      async (req: express.Request, res: express.Response) => {
        const params = ZGetProject.parse(req.params);
        const project = await this.projectStore.get(params.id);
        res.json({ project });
      },
    );

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
        await this.userOrgService.addToProjectCountForOrg(
          user.organizationId,
          1,
        );

        res.json({ project });
      },
    );

    router.delete(
      "/delete/:projectId",
      async (req: express.Request, res: express.Response) => {
        const projectId = req.params.projectId;
        if (typeof projectId !== "string") {
          throw new Error("invalid request");
        }

        const wasDeleted = await this.projectStore.delete(projectId);
        if (!wasDeleted) {
          await this.userOrgService.addToProjectCountForOrg(
            req.user.organizationId,
            -1,
          );
        }
        res.json({ status: "ok" });
      },
    );

    router.patch(
      "/update",
      async (req: express.Request, res: express.Response) => {
        const args = ZUpdateProjectArgs.parse(req.body);
        const project = await this.projectStore.update(args);

        res.json({ project });
      },
    );

    return router;
  }
}
const ZGetProject = z.object({
  id: z.string(),
});

const ZUpdateProjectArgs = z.object({
  id: z.string(),
  name: z.string(),
});

const ZCreateProjectArgs = z.object({
  name: z.string(),
});

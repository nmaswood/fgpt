import {
  AnalysisStore,
  STANDARD_ANALYSIS,
  TaskService,
} from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class AnalysisRouter {
  constructor(
    private readonly analysisStore: AnalysisStore,
    private readonly taskService: TaskService
  ) {}
  init() {
    const router = express.Router();

    router.get(
      "/list/:projectId",
      async (req: express.Request, res: express.Response) => {
        const projectId = req.params.projectId;
        if (typeof projectId !== "string") {
          throw new Error("invalid request");
        }
        const analyses = await this.analysisStore.list(projectId);
        res.json({ analyses });
      }
    );

    router.post(
      "/create",
      async (req: express.Request, res: express.Response) => {
        const body = ZCreateRequestBody.parse(req.body);
        const analysis = await this.analysisStore.insert({
          organizationId: req.user.organizationId,
          name: body.name ?? "DEFAULT_NAME",
          projectId: body.projectId,
          definition: {
            version: "1",
            items: STANDARD_ANALYSIS,
          },
          fileReferenceId: body.fileReferenceId,
        });

        const task = await this.taskService.insert({
          organizationId: req.user.organizationId,
          projectId: body.projectId,
          config: {
            type: "create-analysis",
            version: "1",
            organizationId: req.user.organizationId,
            projectId: body.projectId,
            analysisId: analysis.id,
          },
        });

        const analysisWithTask = await this.analysisStore.update({
          id: analysis.id,
          taskId: task.id,
        });

        res.json({ analysis: analysisWithTask });
      }
    );

    router.delete(
      "/delete/:id",
      async (req: express.Request, res: express.Response) => {
        const id = req.params.id;
        if (typeof id !== "string") {
          throw new Error("invalid request");
        }

        await this.analysisStore.delete(id);

        res.json({ status: "ok" });
      }
    );

    return router;
  }
}

const ZCreateRequestBody = z.object({
  name: z.string().nullable(),
  projectId: z.string(),
  fileReferenceId: z.string(),
});

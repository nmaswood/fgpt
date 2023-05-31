import { ZAnalysisItem } from "@fgpt/precedent-iso";
import { ReportStore } from "@fgpt/precedent-node";
import express from "express";
import { z } from "zod";

export class ReportRouter {
  constructor(private readonly reportStore: ReportStore) {}
  init() {
    const router = express.Router();

    router.get(
      "/list/:projectId",
      async (req: express.Request, res: express.Response) => {
        const projectId = req.params.projectId;
        if (typeof projectId !== "string") {
          throw new Error("invalid request");
        }
        const reports = await this.reportStore.list(projectId);
        res.json({ reports });
      }
    );

    router.post(
      "/create",
      async (req: express.Request, res: express.Response) => {
        const body = ZCreateRequestBody.parse(req.body);
        const report = await this.reportStore.insert({
          organizationId: req.user.organizationId,
          name: body.name,
          projectId: body.projectId,
          definition: {
            version: "1",
            items: body.additionalItems,
          },
        });
        res.json({ report });
      }
    );

    router.delete(
      "/delete/:id",
      async (req: express.Request, res: express.Response) => {
        const id = req.params.id;
        if (typeof id !== "string") {
          throw new Error("invalid request");
        }

        await this.reportStore.delete(id);

        res.json({ status: "ok" });
      }
    );

    return router;
  }
}

const ZCreateRequestBody = z.object({
  name: z.string(),
  projectId: z.string(),
  additionalItems: ZAnalysisItem.array(),
});

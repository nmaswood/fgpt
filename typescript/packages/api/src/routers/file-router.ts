import {
  DisplayFile,
  getFileType,
  ZFileUpload,
  ZPromptSlug,
} from "@fgpt/precedent-iso";
import {
  FileReferenceStore,
  FileStatusService,
  InsertFileReference,
  LoadedFileStore,
  ObjectStorageService,
  ProjectStore,
  PromptTaskService,
  RenderShowCaseFileService,
  ShowCaseFileStore,
  TaskStore,
} from "@fgpt/precedent-node";
import crypto from "crypto";
import express from "express";
import path from "path";
import { z } from "zod";

export class FileRouter {
  constructor(
    private readonly fileReferenceStore: FileReferenceStore,
    private readonly blobStorageService: ObjectStorageService,
    private readonly bucket: string,
    private readonly taskStore: TaskStore,
    private readonly loadedFileStore: LoadedFileStore,
    private readonly projectStore: ProjectStore,
    private readonly showCaseFileStore: ShowCaseFileStore,
    private readonly renderShowCaseFileService: RenderShowCaseFileService,
    private readonly fileStatusService: FileStatusService,
    private readonly promptTaskService: PromptTaskService,
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

        const files = await this.loadedFileStore.paginate({
          projectId,
          cursor: {
            type: "first",
          },
        });
        res.json({ files });
      },
    );

    router.post(
      "/upload",
      async (req: express.Request, res: express.Response) => {
        const { name, storageUrl, projectId, fileSize, contentType } =
          ZFileUpload.parse(req.body);
        const organizationId = req.user.organizationId;

        const parsed = new URL(storageUrl);
        const path = parsed.pathname.split(this.bucket, 2)[1];
        if (path === undefined) {
          throw new Error("Invalid path");
        }

        const ref: InsertFileReference = {
          projectId,
          organizationId,
          fileName: name,
          contentType,
          bucketName: this.bucket,
          path: trimLeadingSlash(path),
          fileSize,
        };

        const fileReference = await this.fileReferenceStore.insert(ref);
        await this.projectStore.addToFileCount(projectId, 1);

        const fileType = getFileType(contentType);

        if (fileType === undefined) {
          throw new Error("Unrecognized file type");
        }

        await this.taskStore.insert({
          organizationId,
          projectId,
          fileReferenceId: fileReference.id,
          config: {
            organizationId: req.user.organizationId,
            projectId: req.body.projectId,
            type: "ingest-file",
            fileReferenceId: fileReference.id,
            fileType,
          },
        });

        res.json({ ok: true });
      },
    );

    router.post(
      "/upload-presigned",

      async (req: express.Request, res: express.Response) => {
        debugger;
        const body = ZUploadPreSigned.parse(req.body);

        const extension = path.extname(body.filename);
        const fileId = crypto.randomUUID();
        const filePath = path.join(
          "user-uploads",
          req.user.organizationId,
          req.body.projectId,
          `${fileId}${extension}`,
        );

        const url = await this.blobStorageService.getPresignedUrl(
          this.bucket,
          filePath,
        );

        return res.json({
          method: "put",
          url,
          fields: {},
          headers: { "content-type": body.contentType },
        });
      },
    );

    router.get(
      "/display-file/:fileReferenceId",
      async (req: express.Request, res: express.Response) => {
        const fileReferenceId = req.params.fileReferenceId;

        if (typeof fileReferenceId !== "string") {
          throw new Error("invalid request");
        }

        const file = await this.fileReferenceStore.get(fileReferenceId);
        const signedUrl = await this.blobStorageService.getSignedUrl(
          this.bucket,
          file.path,
        );

        const display: DisplayFile = {
          signedUrl,
          type: getFileType(file.contentType),
        };

        res.json(display);
      },
    );

    router.get(
      "/show-case-file/:fileReferenceId",
      async (req: express.Request, res: express.Response) => {
        const params = ZSetShowCaseRequest.parse(req.params);
        const file = await this.renderShowCaseFileService.get(
          params.fileReferenceId,
        );
        res.json({ file });
      },
    );

    router.put(
      "/show-case-file/:fileReferenceId",
      async (req: express.Request, res: express.Response) => {
        const params = ZSetShowCaseRequest.parse(req.params);
        const file = await this.fileReferenceStore.get(params.fileReferenceId);
        await this.showCaseFileStore.set(file.projectId, file.id);
        res.json({ status: "ok" });
      },
    );

    router.get(
      "/progress/:fileReferenceId",
      async (req: express.Request, res: express.Response) => {
        const params = ZSetShowCaseRequest.parse(req.params);
        const progress = await this.fileStatusService.progress(
          params.fileReferenceId,
        );
        res.json({ progress: progress.forTask });
      },
    );

    router.put(
      "/trigger",
      async (req: express.Request, res: express.Response) => {
        const { fileReferenceId, slug, projectId } = ZTrigger.parse(req.body);

        const tasksForSlug = await this.promptTaskService.getForSlugs(
          fileReferenceId,
        );

        if (tasksForSlug[slug] !== "not_created") {
          res.json({ status: "task-exists" });
          return;
        }

        await this.taskStore.insert({
          organizationId: req.user.organizationId,
          projectId,
          fileReferenceId,
          config: {
            type: "run-prompt",
            fileReferenceId,
            slug,
          },
        });

        res.json({ status: "created-task" });
      },
    );

    return router;
  }
}

const ZTrigger = z.object({
  projectId: z.string(),
  fileReferenceId: z.string(),
  slug: ZPromptSlug,
});

const ZSetShowCaseRequest = z.object({
  fileReferenceId: z.string(),
});

const ZUploadPreSigned = z.object({
  filename: z.string(),
  contentType: z.string(),
  projectId: z.string(),
});

function trimLeadingSlash(str: string) {
  return str.startsWith("/") ? str.substr(1) : str;
}

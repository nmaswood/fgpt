import { DisplayFile, getFileType, ZPromptSlug } from "@fgpt/precedent-iso";
import {
  FileReferenceStore,
  FileStatusService,
  InsertFileReference,
  LoadedFileStore,
  ObjectStorageService,
  ProjectStore,
  PromptTaskService,
  RenderShowCaseFileService,
  ShaHash,
  ShowCaseFileStore,
  TaskStore,
} from "@fgpt/precedent-node";
import crypto from "crypto";
import express from "express";
import * as F from "fs/promises";
import multer from "multer";
import path from "path";
import { z } from "zod";

const upload = multer({
  dest: "/var/tmp/api-upload",

  limits: {
    fileSize: 100 * 1024 * 1024 * 10000,
  },
});

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
      upload.array("file"),

      async (req: express.Request, res: express.Response) => {
        const body = ZFileBody.parse(req.body);
        const file = getFile(req);
        const buffer = await F.readFile(file.path);

        const organizationId = req.user.organizationId;
        const projectId = body.projectId;

        const extension = path.extname(file.originalname);

        const filePath = path.join(
          "user-uploads",
          organizationId,
          projectId,
          `${crypto.randomBytes(16).toString("hex")}${extension}`,
        );

        await this.blobStorageService.upload(this.bucket, filePath, buffer);

        const ref: InsertFileReference = {
          projectId,
          organizationId,
          fileName: file.originalname,
          contentType: file.mimetype,
          bucketName: this.bucket,
          path: filePath,
          sha256: ShaHash.forData(buffer),
          fileSize: file.size,
        };

        const fileReference = await this.fileReferenceStore.insert(ref);
        await this.projectStore.addToFileCount(projectId, 1);

        const fileType = getFileType(file.mimetype);

        if (fileReference === undefined) {
          throw new Error("failed to insert file reference");
        }
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

        await F.unlink(file.path);

        res.json({ ok: true });
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

const ZFileBody = z.object({
  projectId: z.string(),
});

const ZFile = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  mimetype: z.string(),
  filename: z.string(),
  path: z.string(),
  size: z.number(),
});

const getFile = (req: express.Request) => {
  const files = req.files ?? [];
  if (!Array.isArray(files)) {
    throw new Error("files was not an Array");
  }
  const [file] = files;
  if (!file) {
    throw new Error("no file");
  }
  if (files.length !== 1) {
    throw new Error("unexpected number of files");
  }

  return ZFile.parse(file);
};

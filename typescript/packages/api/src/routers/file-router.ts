import { assertNever, getFileType } from "@fgpt/precedent-iso";
import {
  FileReferenceStore,
  InsertFileReference,
  LoadedFileStore,
  ObjectStorageService,
  ShaHash,
  TaskStore,
  ProjectStore,
} from "@fgpt/precedent-node";
import crypto from "crypto";
import express from "express";
import * as F from "fs/promises";
import multer from "multer";
import path from "path";
import { z } from "zod";

import { LOGGER } from "../logger";

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
    private readonly projectStore: ProjectStore
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
      }
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
          `${crypto.randomBytes(16).toString("hex")}${extension}`
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

        const [fileRef] = await this.fileReferenceStore.insertMany([ref]);
        await this.projectStore.addToFileCount(projectId, 1);

        const fileType = getFileType(file.mimetype);

        if (fileRef === undefined) {
          throw new Error("failed to insert file reference");
        }
        if (fileType === undefined) {
          throw new Error("Unrecognized file type");
        }

        switch (fileType) {
          case "pdf": {
            await this.taskStore.insert({
              organizationId,
              projectId,
              fileReferenceId: fileRef.id,
              config: {
                version: "1",
                organizationId: req.user.organizationId,
                projectId: req.body.projectId,
                type: "text-extraction",
                fileId: fileRef.id,
              },
            });
            break;
          }
          case "excel": {
            LOGGER.info({ mimetype: file.mimetype }, "Excel file detected");
            await this.taskStore.insert({
              organizationId,
              projectId,
              fileReferenceId: fileRef.id,
              config: {
                version: "1",
                type: "analyze-table",
                organizationId: req.user.organizationId,
                projectId: req.body.projectId,
                fileReferenceId: fileRef.id,
                source: {
                  type: "direct-upload",
                },
              },
            });

            break;
          }
          default:
            assertNever(fileType);
        }

        await F.unlink(file.path);

        res.json({ ok: true });
      }
    );

    router.get(
      "/signed-url/:fileId",
      async (req: express.Request, res: express.Response) => {
        const fileId = req.params.fileId;

        if (typeof fileId !== "string") {
          throw new Error("invalid request");
        }

        const file = await this.fileReferenceStore.get(fileId);
        const signedUrl = await this.blobStorageService.getSignedUrl(
          this.bucket,
          file.path
        );

        res.json({ signedUrl });
      }
    );

    router.get(
      "/single/:fileReferenceId",
      async (req: express.Request, res: express.Response) => {
        const params = ZSingleRequest.parse(req.params);
        const file = await this.fileReferenceStore.get(params.fileReferenceId);
        res.json({ file });
      }
    );
    return router;
  }
}

const ZSingleRequest = z.object({
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

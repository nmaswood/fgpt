import {
  BlobStorageService,
  FileReferenceStore,
  InsertFileReference,
} from "@fgpt/precedent-node";
import crypto from "crypto";
import express from "express";
import * as F from "fs/promises";
import multer from "multer";
import path from "path";
import { z } from "zod";

const upload = multer({ dest: "/var/tmp/api-upload" });

export class FileRouter {
  constructor(
    private readonly fileReferenceStore: FileReferenceStore,
    private readonly blobStorageService: BlobStorageService,
    private readonly bucket: string
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

        const files = await this.fileReferenceStore.list(projectId);
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

        const filePath = path.join(
          req.user.organizationId,
          body.projectId,
          crypto.randomBytes(16).toString("hex")
        );

        await this.blobStorageService.upload(this.bucket, filePath, buffer);

        const ref: InsertFileReference = {
          projectId: body.projectId,
          fileName: file.originalname,
          contentType: file.mimetype,
          bucketName: this.bucket,
          path: filePath,
        };

        await this.fileReferenceStore.insertMany([ref]);

        res.json({ ok: true });
      }
    );

    return router;
  }
}

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

import * as cheerio from "cheerio";

import { FileReferenceStore } from "./file-reference-store";
import { ObjectStorageService } from "./object-store/object-store";
import { TikaClient } from "./tika/tika-client";

export interface TextExtractor {
  extract(fileId: string): Promise<ExtractResponse>;
}

export interface TextWithPage {
  page: number;
  text: string;
}

export interface ExtractResponse {
  pages: TextWithPage[];
  text: string;
}

export class TikaTextExtractor implements TextExtractor {
  constructor(
    private readonly fileReferenceStore: FileReferenceStore,
    private readonly bucketName: string,
    private readonly blobStore: ObjectStorageService,
    private readonly tikaClient: TikaClient,
  ) {}

  async extract(fileId: string): Promise<ExtractResponse> {
    const file = await this.fileReferenceStore.get(fileId);
    const blob = await this.blobStore.download(this.bucketName, file.path);
    const html = await this.tikaClient.extract(file.fileName, blob);
    const $ = cheerio.load(html);

    const pages = $("div.page")
      .map((page, element) => ({
        page,
        text: $(element).text(),
      }))
      .toArray();

    return {
      pages,
      text: pages.map((page) => page.text).join(""),
    };
  }
}

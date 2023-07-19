import { assertNever, Outputs, RenderShowCaseFile } from "@fgpt/precedent-iso";

import { FileReferenceStore } from "./file-reference-store";
import { MiscOutputStore } from "./llm-outputs/misc-output-store";
import { ObjectStorageService } from "./object-store/object-store";
import { ShowCaseFileStore } from "./show-case-file-store";

export interface RenderShowCaseFileService {
  get: (projectId: string) => Promise<RenderShowCaseFile.File>;
}

export class RenderShowCaseFileServiceImpl
  implements RenderShowCaseFileService
{
  constructor(
    private readonly showCaseFileStore: ShowCaseFileStore,
    private readonly objectStore: ObjectStorageService,
    private readonly fileReferenceStore: FileReferenceStore,
    private readonly miscValueStore: MiscOutputStore,
    private readonly bucket: string,
  ) {}

  async get(projectId: string): Promise<RenderShowCaseFile.File> {
    const showCaseFile = await this.showCaseFileStore.get(projectId);
    if (!showCaseFile) {
      return RenderShowCaseFile.NOT_SET;
    }
    const [path, miscValues] = await Promise.all([
      this.fileReferenceStore.getThumbnailPath(showCaseFile.fileReferenceId),
      this.miscValueStore.getForFile(showCaseFile.fileReferenceId),
    ]);

    return {
      type: "set",
      url: path
        ? await this.objectStore.getSignedUrl(this.bucket, path)
        : undefined,
      fileReferenceId: showCaseFile.fileReferenceId,

      terms: extractTerms(miscValues),
    };
  }
}

function extractTerms(values: Outputs.MiscValue[]): Outputs.Term[] {
  const alreadySeenTerms = new Set<string>();
  const acc: Outputs.Term[] = [];
  for (const value of values) {
    switch (value.type) {
      case "terms":
        for (const term of value.value) {
          if (alreadySeenTerms.has(term.termName)) {
            continue;
          }
          acc.push(term);

          alreadySeenTerms.add(term.termName);
        }
        break;
      case "financial_summary":
      case "long_form":
      case "summary":
        break;
      default:
        assertNever(value);
    }
  }
  return acc;
}

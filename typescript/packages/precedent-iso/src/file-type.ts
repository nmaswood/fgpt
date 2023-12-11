import { z } from "zod";
export const ZFileType = z.enum(["excel", "pdf"]);
export type FileType = z.infer<typeof ZFileType>;
export function getFileType(assetType: string): FileType | undefined {
  switch (assetType) {
    case "application/pdf":
      return "pdf";
    case "application/vnd.ms-excel":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return "excel";
    default:
      return undefined;
  }
}

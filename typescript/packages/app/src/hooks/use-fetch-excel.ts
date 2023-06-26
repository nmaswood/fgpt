import { ExcelFileToDisplay } from "@fgpt/precedent-iso";
import useSWR from "swr";

export interface ExcelInfo {
  excel: ExcelFileToDisplay | undefined;
  forSheets: Record<number, Record<string, unknown>>;
}

export const useExcelInfo = (fileReferenceId: string) => {
  const { data, isLoading, mutate } = useSWR<
    ExcelInfo | undefined,
    ["/api/proxy/v1/output/excel", string]
  >(["/api/proxy/v1/output/excel", fileReferenceId], fileFetcher, {});

  return { data, isLoading, mutate };
};

async function fileFetcher([url, fileReferenceId]: [
  "/api/proxy/v1/output/excel",
  string
]): Promise<ExcelInfo | undefined> {
  const response = await fetch(`${url}/${fileReferenceId}`);
  const data = await response.json();

  return data;
}

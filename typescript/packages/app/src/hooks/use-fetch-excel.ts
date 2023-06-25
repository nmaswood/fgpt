import { ExcelFileToDisplay } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useExcelAsset = (fileReferenceId: string) => {
  const { data, isLoading, mutate } = useSWR<
    ExcelFileToDisplay | undefined,
    ["/api/proxy/v1/output/excel", string]
  >(["/api/proxy/v1/output/excel", fileReferenceId], fileFetcher, {});

  return { data, isLoading, mutate };
};

async function fileFetcher([url, fileReferenceId]: [
  "/api/proxy/v1/output/excel",
  string
]): Promise<ExcelFileToDisplay | undefined> {
  const response = await fetch(`${url}/${fileReferenceId}`);
  const data = await response.json();

  return data.url;
}

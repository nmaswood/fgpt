import useSWR from "swr";

export const useExcelAssets = (fileReferenceId: string) => {
  const { data, isLoading, mutate } = useSWR<
    string[],
    ["/api/proxy/v1/output/excel", string]
  >(["/api/proxy/v1/output/excel", fileReferenceId], fileFetcher, {});

  return { data: data ?? [], isLoading, mutate };
};

async function fileFetcher([url, fileReferenceId]: [
  "/api/proxy/v1/output/excel",
  string
]): Promise<string[]> {
  const response = await fetch(`${url}/${fileReferenceId}`);
  const data = await response.json();

  return data.urls;
}

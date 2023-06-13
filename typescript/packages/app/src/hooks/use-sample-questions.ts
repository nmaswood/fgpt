import useSWR from "swr";

export const useSampleForFile = (fileReferenceId: string) => {
  const { data, isLoading, mutate } = useSWR<
    string[],
    ["/api/proxy/v1/output/sample-file", string]
  >(["/api/proxy/v1/output/sample-file", fileReferenceId], fileFetcher);

  return { data: data ?? [], isLoading, mutate };
};

async function fileFetcher([url, fileReferenceId]: [
  "/api/proxy/v1/output/sample-file",
  string
]): Promise<string[]> {
  const response = await fetch(`${url}/${fileReferenceId}`);
  const data = await response.json();

  return data.questions;
}

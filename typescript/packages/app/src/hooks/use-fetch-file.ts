import { FileReference } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchFile = (fileReferenceId: string) => {
  const { data, isLoading, mutate } = useSWR<
    FileReference,
    ["/api/proxy/v1/files/single", string]
  >(["/api/proxy/v1/files/single", fileReferenceId], fetcher);

  return { data, isLoading, mutate };
};

async function fetcher([url, fileReferenceId]: [
  "/api/proxy/v1/files/single",
  string
]): Promise<FileReference> {
  const response = await fetch(`${url}/${fileReferenceId}`);
  const data = await response.json();
  return data.file;
}

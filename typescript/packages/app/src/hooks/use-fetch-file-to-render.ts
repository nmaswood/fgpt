import { FileToRender } from "@fgpt/precedent-iso";

import useSWR from "swr";

export const useFetchFileToRender = (fileReferenceId: string) => {
  const { data, isLoading, mutate } = useSWR<
    FileToRender.File | undefined,
    ["/api/proxy/v1/output/render-file", string]
  >(["/api/proxy/v1/output/render-file", fileReferenceId], fileFetcher, {});

  return { data, isLoading, mutate };
};

async function fileFetcher([url, fileReferenceId]: [
  "/api/proxy/v1/output/render-file",
  string
]): Promise<FileToRender.File | undefined> {
  const response = await fetch(`${url}/${fileReferenceId}`);
  const data = await response.json();

  return data.file;
}

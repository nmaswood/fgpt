import { RenderShowCaseFile } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchShowCaseFile = (projectId: string) => {
  return useSWR<
    RenderShowCaseFile.File,
    ["/api/proxy/v1/files/show-case-file", string]
  >(["/api/proxy/v1/files/show-case-file", projectId], fetcher);
};

async function fetcher([url, projectId]: [
  "/api/proxy/v1/files/show-case-file",
  string,
]): Promise<RenderShowCaseFile.File> {
  const response = await fetch(`${url}/${projectId}`);
  const data = await response.json();
  return data.file;
}

import { LoadedFile } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchFiles = (projectId: string) => {
  const { data, isLoading, mutate } = useSWR<
    LoadedFile[],
    ["api/proxy/v1/files/list", string]
  >(["api/proxy/v1/files/list", projectId], fetcher);

  return { data: data ?? [], isLoading, mutate };
};

async function fetcher([url, projectId]: [
  "api/proxy/v1/files/list",
  string
]): Promise<LoadedFile[]> {
  const response = await fetch(`${url}/${projectId}`);
  const data = await response.json();
  return data.files;
}

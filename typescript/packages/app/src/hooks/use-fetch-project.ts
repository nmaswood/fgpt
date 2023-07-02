import { Project } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchProject = (projectId: string | undefined) => {
  const { data, isLoading, mutate } = useSWR<
    Project | undefined,
    ["/api/proxy/v1/projects", string | undefined]
  >(["/api/proxy/v1/projects", projectId], fetcher);

  return { data, isLoading, mutate };
};

async function fetcher([url, projectId]: [
  "/api/proxy/v1/projects",
  string | undefined
]): Promise<Project | undefined> {
  if (!projectId) {
    return undefined;
  }
  const response = await fetch(`${url}/${projectId}`);
  const data = await response.json();
  return data.project;
}

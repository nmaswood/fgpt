import { Project } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchProject = (projectId: string | undefined) => {
  const { data, isLoading, mutate, error } = useSWR<
    Project,
    ["/api/proxy/v1/projects/project", string]
  >(["/api/proxy/v1/projects/project", projectId], projectId ? fetcher : null);

  return { data, isLoading, mutate, error };
};

async function fetcher([url, projectId]: [
  "/api/proxy/v1/projects/project",
  string,
]): Promise<Project> {
  const response = await fetch(`${url}/${projectId}`);
  const data = await response.json();
  return data.project;
}

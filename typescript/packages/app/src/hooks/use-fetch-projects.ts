import { Project } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchProjects = () => {
  const response = useSWR<Project[]>(
    "api/proxy/v1/projects/list",
    async (url) => {
      const response = await fetch(url);
      const data = await response.json();
      return data.projects.reverse();
    }
  );

  return {
    ...response,
    data: response.data ?? [],
  };
};

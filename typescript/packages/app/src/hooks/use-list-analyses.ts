import { Analysis } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useListAnalyses = (projectId: string) => {
  const { data, isLoading, mutate } = useSWR<
    Analysis[],
    ["api/proxy/v1/analyses/list", string]
  >(["api/proxy/v1/analyses/list", projectId], fetcher);

  return { data: data ?? [], isLoading, mutate };
};

async function fetcher([url, projectId]: [
  "api/proxy/v1/analyses/list",
  string
]): Promise<Analysis[]> {
  const response = await fetch(`${url}/${projectId}`);
  const data = await response.json();
  return data.analyses;
}

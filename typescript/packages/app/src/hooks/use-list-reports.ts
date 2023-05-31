import { Report } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useListReports = (projectId: string) => {
  const { data, isLoading, mutate } = useSWR<
    Report[],
    ["api/proxy/v1/reports/list", string]
  >(["api/proxy/v1/reports/list", projectId], fetcher);

  return { data: data ?? [], isLoading, mutate };
};

async function fetcher([url, projectId]: [
  "api/proxy/v1/reports/list",
  string
]): Promise<Report[]> {
  const response = await fetch(`${url}/${projectId}`);
  const data = await response.json();
  return data.reports;
}

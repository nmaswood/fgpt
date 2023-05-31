import { AnalysisItem } from "@fgpt/precedent-iso";
import useSWRMutation from "swr/mutation";

import { useListReports } from "./use-list-reports";

export const useCreateReport = (projectId: string) => {
  const { mutate } = useListReports(projectId);

  const res = useSWRMutation<
    string,
    unknown,
    "/api/proxy/v1/reports/create",
    {
      projectId: string;
      name: string;
      additionalItems: AnalysisItem[];
    }
  >("/api/proxy/v1/reports/create", async (url: string, args) => {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(args.arg),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    mutate();
    return data.project;
  });

  return res;
};

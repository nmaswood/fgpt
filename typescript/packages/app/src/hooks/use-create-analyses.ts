import { AnalysisItem } from "@fgpt/precedent-iso";
import useSWRMutation from "swr/mutation";

import { useListAnalyses } from "./use-list-analyses";

export const useCreateAnalysis = (projectId: string) => {
  const { mutate } = useListAnalyses(projectId);

  const res = useSWRMutation<
    string,
    unknown,
    "/api/proxy/v1/analyses/create",
    {
      projectId: string;
      name: string;
      additionalItems: AnalysisItem[];
    }
  >("/api/proxy/v1/analyses/create", async (url: string, args) => {
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
